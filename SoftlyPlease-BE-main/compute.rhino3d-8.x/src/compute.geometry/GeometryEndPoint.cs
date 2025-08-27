﻿using System;
using System.Collections.Generic;
using System.Reflection;
using System.Linq;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using Rhino.Geometry;
using Rhino.Runtime;
using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;


namespace compute.geometry
{
    class GeometryEndPoint
    {
        static List<GeometryEndPoint> _allEndPoints;
        public static IEnumerable<GeometryEndPoint> AllEndPoints
        {
            get
            {
                if(_allEndPoints==null)
                {
                    _allEndPoints = new List<GeometryEndPoint>();
                    foreach (string nameSpace in new string[] { "Rhino.Geometry", "Rhino.Geometry.Intersect" })
                    {
                        foreach (var endpoint in CreateEndpoints(typeof(Rhino.RhinoApp).Assembly, nameSpace))
                        {
                            _allEndPoints.Add(endpoint);
                        }
                    }

                    var method = typeof(Rhino.Runtime.HostUtils).GetMethod("GetCustomComputeEndpoints");
                    if( method!=null )
                    {
                        var customEndpoints = method.Invoke(null, null) as Tuple<string, Type>[];
                        if( customEndpoints != null )
                        {
                            foreach (var customEndpoint in customEndpoints)
                            {

                                foreach (var endpoint in GeometryEndPoint.Create(customEndpoint.Item2))
                                {
                                    endpoint.UpdatePath(customEndpoint.Item1);
                                    _allEndPoints.Add(endpoint);
                                }
                            }
                        }
                    }
                }
                return _allEndPoints;
            }
        }

        private static IEnumerable<GeometryEndPoint> CreateEndpoints(Assembly assembly, string nameSpace)
        {
            foreach (var export in assembly.GetExportedTypes())
            {
                if (!string.Equals(export.Namespace, nameSpace, StringComparison.Ordinal))
                    continue;
                if (export.IsInterface || export.IsEnum)
                    continue;
                if (export.IsClass || export.IsValueType)
                {
                    var endpoints = GeometryEndPoint.Create(export);
                    foreach (var endpoint in endpoints)
                    {
                        yield return endpoint;
                    }
                }
            }
        }


        Type _classType;
        ConstructorInfo[] _constructors;
        MethodInfo[] _methods;
        string _path;

        public string Path
        {
            get { return _path; }
            private set
            {
                _path = value;
                PathURL = _path.ToLowerInvariant();
            }
        }

        public string PathURL { get; private set; }

        public void UpdatePath(string basePath)
        {
            int index = _path.LastIndexOf('/');
            if( index > 0 )
            {
                basePath = basePath.Replace('.', '/').ToLowerInvariant();
                Path = basePath + _path.Substring(index);
            }
        }

        private GeometryEndPoint(Type classType, ConstructorInfo[] constructors)
        {
            _classType = classType;
            _constructors = constructors;
            string basepath = _classType.FullName.Replace('.', '/');
            Path = basepath + "/New";
        }

        private GeometryEndPoint(Type classType, MethodInfo[] methods, bool explicitPath)
        {
            _classType = classType;
            _methods = methods;
            string basepath = _classType.FullName.Replace('.', '/');
            string funcname = methods[0].Name;
            if (funcname.StartsWith("get_"))
                funcname = "Get" + funcname.Substring("get_".Length);
            else if (funcname.StartsWith("set_"))
                funcname = "Set" + funcname.Substring("set_".Length);
            Path = basepath + "/" + funcname;
            if (explicitPath)
            {
                var parameters = methods[0].GetParameters();
                var extra = new System.Text.StringBuilder();
                bool dashAdded = false;
                if (!methods[0].IsStatic)
                {
                    extra.Append($"-{classType.Name}");
                    dashAdded = true;
                }
                for (int i = 0; i < parameters.Length; i++)
                {
                    extra.Append(dashAdded ? "_" : "-");
                    dashAdded = true;

                    var parameter = parameters[i];
                    var type = parameter.ParameterType;
                    string name = type.Name.Replace("&", "");
                    if (name.StartsWith("IEnumerable"))
                    {
                        Type[] genericArgs = type.GetGenericArguments();
                        name = genericArgs[0].Name + "Array";
                    }
                    name = name.Replace("[]", "Array").Replace("Int32", "Int").Replace("Boolean", "Bool");
                    if (name.Equals("JObject"))
                        name = "jsonobject";

                    extra.Append(name);
                }
                Path = Path + extra.ToString();
            }
        }

        private GeometryEndPoint(Type classType, MethodInfo[] methods) : this(classType, methods, false) { }
        private GeometryEndPoint(Type classType, MethodInfo method) : this(classType, new MethodInfo[] { method }, true) { }

        protected GeometryEndPoint(string path, Type classType)
        {
            Path = path;
            _classType = classType;
        }

        public static List<GeometryEndPoint> Create(Type t)
        {
            List<GeometryEndPoint> endpoints = new List<GeometryEndPoint>();
            if (!t.IsAbstract)
            {
                var constructors = t.GetConstructors(BindingFlags.Instance | BindingFlags.Public);
                if (constructors != null && constructors.Length > 0)
                {
                    GeometryEndPoint endpoint = new GeometryEndPoint(t, constructors);
                    endpoints.Add(endpoint);
                }
            }

            var methods = t.GetMethods(BindingFlags.Public | BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static);
            var methodlist = new List<MethodInfo>(methods);
            methodlist.Sort((a, b) => a.Name.CompareTo(b.Name));
            for (int i = 0; i < methodlist.Count; i++)
            {
                string funcname = methodlist[i].Name;
                var overloads = new List<MethodInfo>();
                overloads.Add(methodlist[i]);
                for (int j = i + 1; j < methodlist.Count; j++)
                {
                    if (funcname.Equals(methodlist[j].Name))
                    {
                        i = j;
                        overloads.Add(methodlist[i]);
                        continue;
                    }
                    break;
                }

                if (overloads.Count > 1)
                {
                    // This is the general "catch all" endpoint that attempts to figure out the best routine to call
                    GeometryEndPoint endpoint = new GeometryEndPoint(t, overloads.ToArray());
                    endpoints.Add(endpoint);
                }

                foreach (var overload in overloads)
                {
                    // generate explicit endpoints for all overloads, even if there are no parameters (see #142)
                    endpoints.Add(new GeometryEndPoint(t, overload));
                }
            }

            return endpoints;
        }


        protected static string PrettyString(Type t)
        {
            string rc = t.ToString().Replace("&", "");
            if (rc.Equals("System.Double", StringComparison.Ordinal))
                return "double";
            if (rc.Equals("System.Int32", StringComparison.Ordinal))
                return "int";
            if (rc.Equals("System.Boolean", StringComparison.Ordinal))
                return "bool";
            if (rc.Equals("System.Single", StringComparison.Ordinal))
                return "float";
            return rc;
        }

        string FunctionName()
        {
            string path = Path;
            int index = path.LastIndexOf("/");
            string funcname = path.Substring(index + 1);
            index = funcname.IndexOf("-");
            if (index > 0)
                funcname = funcname.Substring(0, index);
            return funcname;
        }

        public async Task Get(HttpContext context)
        {
            string funcname = FunctionName();
            var sb = new System.Text.StringBuilder("<!DOCTYPE html><html><body>");
            sb.AppendLine($"<H1>{funcname}</H1>");
            sb.AppendLine("<p>");
            if (_methods != null)
            {
                foreach (var method in _methods)
                {
                    var inParams = new List<Tuple<Type, string>>();
                    var outParams = new List<Tuple<Type, string>>();
                    {
                        if (!method.IsStatic)
                            inParams.Add(new Tuple<Type, string>(_classType, "self"));
                        if (method.ReturnType != typeof(void))
                            outParams.Add(new Tuple<Type, string>(method.ReturnType, ""));
                        foreach (var parameter in method.GetParameters())
                        {
                            if (parameter.IsOut || parameter.ParameterType.IsByRef)
                                outParams.Add(new Tuple<Type, string>(parameter.ParameterType, parameter.Name));
                            if (!parameter.IsOut)
                                inParams.Add(new Tuple<Type, string>(parameter.ParameterType, parameter.Name));
                        }
                        if (!method.IsStatic)
                        {
                            object[] methodAttrs = method.GetCustomAttributes(true);
                            if (methodAttrs != null)
                            {
                                bool isConst = false;
                                for (int i = 0; i < methodAttrs.Length; i++)
                                {
                                    Attribute attr = methodAttrs[i] as Attribute;
                                    if (attr != null && attr.ToString().Contains("ConstOperationAttribute"))
                                    {
                                        isConst = true;
                                        break;
                                    }
                                }
                                if (!isConst)
                                    outParams.Add(new Tuple<Type, string>(_classType, ""));
                            }
                        }
                    }

                    if (outParams.Count > 1)
                        sb.Append("[");
                    for (int i = 0; i < outParams.Count; i++)
                    {
                        sb.Append($"{PrettyString(outParams[i].Item1)}");
                        if (outParams[i].Item2 != "")
                            sb.Append($" {outParams[i].Item2}");
                        if (i < (outParams.Count - 1))
                            sb.Append(", ");
                    }
                    sb.Append(outParams.Count > 1 ? "] " : " ");

                    sb.Append($"{funcname}(");

                    for (int i = 0; i < inParams.Count; i++)
                    {
                        sb.Append($"{PrettyString(inParams[i].Item1)} {inParams[i].Item2}");
                        if (i < (inParams.Count - 1))
                            sb.Append(", ");
                    }
                    sb.AppendLine(")<br>");
                }
            }
            if (_constructors != null)
            {
                foreach (var constructor in _constructors)
                {
                    sb.Append($"{_classType.Name} {funcname}(");
                    var parameters = constructor.GetParameters();
                    for (int pi = 0; pi < parameters.Length; pi++)
                    {
                        sb.Append($"{PrettyString(parameters[pi].ParameterType)} {parameters[pi].Name}");
                        if (pi < (parameters.Length - 1))
                            sb.Append(", ");
                    }
                    sb.AppendLine(")<br>");
                }
            }
            sb.AppendLine("</p></body></html>");
            await context.Response.WriteAsync(sb.ToString());
        }

        enum StopAt : int
        {
            None = 0,
            PostStart = 1,
            BodyToString = 2,
            CalculationsComplete = 3
        }

        public async Task Post(HttpContext context)
        {
            context.Response.ContentType = "application/json";
            DateTime start = DateTime.Now;
            StopAt stopat = StopAt.None;
            bool multiple = false;
            Dictionary<string, string> returnModifiers = null;
            foreach (string name in context.Request.Query.Keys)
            {
                if (name.StartsWith("return.", StringComparison.InvariantCultureIgnoreCase))
                {
                    if (returnModifiers == null)
                        returnModifiers = new Dictionary<string, string>();
                    string dataType = "Rhino.Geometry." + name.Substring("return.".Length);
                    string items = context.Request.Query[name];
                    returnModifiers[dataType] = items;
                    continue;
                }
                if (name.Equals("multiple", StringComparison.InvariantCultureIgnoreCase))
                {
                    multiple = bool.Parse(context.Request.Query[name][0]);
                    continue;
                }
                if (name.Equals("stopat", StringComparison.InvariantCultureIgnoreCase))
                {
                    int val = int.Parse(context.Request.Query[name][0]);
                    stopat = (StopAt)val;
                }
            }
            if (StopAt.PostStart == stopat)
            {
                await context.Response.WriteAsync($"{(DateTime.Now - start).TotalSeconds}");
                return;
            }

            var jsonString = await new System.IO.StreamReader(context.Request.Body).ReadToEndAsync();
            if (StopAt.BodyToString == stopat)
            {
                await context.Response.WriteAsync($"{(DateTime.Now - start).TotalSeconds}");
                return;
            }

            object data = string.IsNullOrWhiteSpace(jsonString) ? null : JsonConvert.DeserializeObject(jsonString);
            var ja = data as Newtonsoft.Json.Linq.JArray;
            string resultString = null;
            if (multiple && ja.Count > 1)
            {
                var result = new System.Text.StringBuilder("[");
                for (int i = 0; i < ja.Count; i++)
                {
                    if (i > 0)
                        result.Append(",");
                    var item = ja[i] as Newtonsoft.Json.Linq.JArray;
                    result.Append(HandlePostHelper(item, returnModifiers));
                }
                result.Append("]");
                resultString = result.ToString();
            }
            else
                resultString = HandlePostHelper(ja, returnModifiers);

            if (StopAt.CalculationsComplete == stopat)
            {
                await context.Response.WriteAsync($"{(DateTime.Now - start).TotalSeconds}");
                return;
            }
            await context.Response.WriteAsync(resultString);
        }

        static object ProcessModifiers(object o, Dictionary<string, string> returnModifiers)
        {
            if (returnModifiers != null && returnModifiers.Count > 0)
            {
                Type t = o.GetType();
                if (returnModifiers.ContainsKey(t.FullName))
                {
                    string[] items = returnModifiers[t.FullName].Split(',');
                    object[] mods = new object[items.Length];
                    for (int i = 0; i < items.Length; i++)
                    {
                        PropertyInfo pi = t.GetProperty(items[i]);
                        mods[i] = pi.GetValue(o);
                    }
                    if (mods.Length == 1)
                        o = mods[0];
                    else
                        o = mods;
                }
            }
            return o;
        }

        static CommonObject CommonObjectFromJToken(JToken jsonElement)
        {
            int archive3dm = (int)jsonElement["archive3dm"];
            int opennurbs = (int)jsonElement["opennurbs"];
            string data = (string)jsonElement["data"];
            return CommonObject.FromBase64String(archive3dm, opennurbs, data);
        }

        static object ToObjectHelper(JToken jsonElement, Type objectType, JsonSerializer serializer)
        {
            if (typeof(CommonObject).IsAssignableFrom(objectType))
            {
                int archive3dm = (int)jsonElement["archive3dm"];
                int opennurbs = (int)jsonElement["opennurbs"];
                string data = (string)jsonElement["data"];
                CommonObject rc = CommonObject.FromBase64String(archive3dm, opennurbs, data);
                // Steve: I'm still undecided on if we should 'magically' convert
                //if(objectType.Equals(typeof(Brep)) && rc is Extrusion)
                //{
                //    Extrusion extrusion = rc as Extrusion;
                //    return extrusion.ToBrep();
                //}
                return rc;
            }
            if (serializer == null)
            {
                return jsonElement.ToObject(objectType);
            }
            return jsonElement.ToObject(objectType, serializer);
        }

        string HandlePostHelper(Newtonsoft.Json.Linq.JArray ja, Dictionary<string, string> returnModifiers)
        {
            int tokenCount = ja == null ? 0 : ja.Count;
            if (_methods != null)
            {
                JsonSerializer serializer = new JsonSerializer();
                serializer.Converters.Add(new ArchivableDictionaryResolver());
                int methodIndex = -1;
                foreach (var method in _methods)
                {
                    methodIndex++;
                    int paramCount = method.GetParameters().Length;
                    if (!method.IsStatic)
                        paramCount++;
                    foreach (var parameter in method.GetParameters())
                    {
                        if (parameter.IsOut)
                            paramCount--;
                    }
                    if (paramCount == tokenCount)
                    {
                        var methodParameters = method.GetParameters();
                        object invokeObj = null;
                        object[] invokeParameters = new object[methodParameters.Length];
                        int currentJa = 0;
                        if (!method.IsStatic)
                        {
                            invokeObj = ToObjectHelper(ja[currentJa++], _classType, null);
                        }

                        int outParamCount = 0;
                        try
                        {
                            for (int i = 0; i < methodParameters.Length; i++)
                            {
                                if (!methodParameters[i].IsOut)
                                {
                                    var jsonobject = ja[currentJa++];
                                    var generics = methodParameters[i].ParameterType.GetGenericArguments();

                                    Type objectType = null;
                                    bool useSerializer = true;
                                    if (generics == null || generics.Length != 1)
                                    {
                                        objectType = methodParameters[i].ParameterType;
                                        useSerializer = true;
                                    }
                                    else
                                    {
                                        objectType = generics[0].MakeArrayType();
                                        useSerializer = false;
                                    }


                                    invokeParameters[i] = DataCache.GetCachedItem(jsonobject, objectType, useSerializer ? serializer : null);


                                    if (invokeParameters[i] == null)
                                    {
                                        if (useSerializer)
                                        {
                                            invokeParameters[i] = ToObjectHelper(jsonobject, objectType, serializer);
                                        }
                                        else
                                        {
                                            // TODO: Update ToObjectHelper to handle types that could be CommonObject[]
                                            if (objectType == typeof(GeometryBase[]))
                                            {
                                                // 6 Sept 2020 S. Baer
                                                // This needs to be tuned up. Json.Net is having issues creating arrays of
                                                // GeometryBase since that class is abstract. I think we need to generalize this
                                                // solution, but for now I can repeat the issue when calling
                                                // AreaMassProperties.Compute(IEnumerable<GeometryBase>)
                                                // from an endpoint
                                                GeometryBase[] items = new GeometryBase[jsonobject.Count()];
                                                for (int itemIndex = 0; itemIndex < items.Length; itemIndex++)
                                                {
                                                    var jsonElement = jsonobject[itemIndex];
                                                    items[itemIndex] = CommonObjectFromJToken(jsonElement) as GeometryBase;
                                                }
                                                invokeParameters[i] = items;
                                            }
                                            else
                                            {
                                                invokeParameters[i] = ToObjectHelper(jsonobject, objectType, null);
                                            }
                                        }
                                    }
                                }

                                if (methodParameters[i].IsOut || methodParameters[i].ParameterType.IsByRef)
                                    outParamCount++;
                            }
                        }
                        catch (Exception)
                        {
                            if (methodIndex < (_methods.Count() - 1))
                                continue;
                            throw;
                        }
                        bool isConst = false;
                        if (!method.IsStatic)
                        {
                            object[] methodAttrs = method.GetCustomAttributes(true);
                            if (methodAttrs != null)
                            {
                                for (int i = 0; i < methodAttrs.Length; i++)
                                {
                                    Attribute attr = methodAttrs[i] as Attribute;
                                    if (attr != null && attr.ToString().Contains("ConstOperationAttribute"))
                                    {
                                        isConst = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (method.ReturnType != typeof(void) || (!method.IsStatic && !isConst))
                            outParamCount++;
                        var invokeResult = method.Invoke(invokeObj, invokeParameters);
                        if (outParamCount < 1)
                            return "";
                        object[] rc = new object[outParamCount];
                        int outputSlot = 0;
                        if (method.ReturnType != typeof(void))
                            rc[outputSlot++] = invokeResult;
                        else if (!method.IsStatic && !isConst)
                            rc[outputSlot++] = invokeObj;
                        for (int i = 0; i < methodParameters.Length; i++)
                        {
                            if (methodParameters[i].IsOut || methodParameters[i].ParameterType.IsByRef)
                                rc[outputSlot++] = invokeParameters[i];
                        }

                        if (returnModifiers != null && returnModifiers.Count > 0)
                        {
                            for (int i = 0; i < rc.Length; i++)
                            {
                                rc[i] = ProcessModifiers(rc[i], returnModifiers);
                            }
                        }

                        if (rc.Length == 1)
                            return Newtonsoft.Json.JsonConvert.SerializeObject(rc[0], GeometryResolver.Settings(7));
                        return Newtonsoft.Json.JsonConvert.SerializeObject(rc, GeometryResolver.Settings(7));
                    }
                }
            }

            if (_constructors != null)
            {
                for (int k = 0; k < _constructors.Length; k++)
                {
                    var constructor = _constructors[k];
                    int paramCount = constructor.GetParameters().Length;
                    if (paramCount == tokenCount)
                    {
                        object[] parameters = new object[tokenCount];
                        var p = constructor.GetParameters();
                        try
                        {
                            bool skipThisConstructor = false;
                            for (int ip = 0; ip < tokenCount; ip++)
                            {
                                var generics = p[ip].ParameterType.GetGenericArguments();
                                if (generics == null || generics.Length != 1)
                                {
                                    if (_constructors.Length > 0 && p[ip].ParameterType == typeof(Rhino.Geometry.Plane))
                                    {
                                        if (ja[ip].Count() < 4)
                                        {
                                            skipThisConstructor = true;
                                            ip = tokenCount;
                                            continue;
                                        }
                                    }
                                    parameters[ip] = ja[ip].ToObject(p[ip].ParameterType);
                                }
                                else
                                {
                                    var arrayType = generics[0].MakeArrayType();
                                    parameters[ip] = ja[ip].ToObject(arrayType);
                                }
                            }
                            if (skipThisConstructor)
                                continue;
                        }
                        catch (Exception)
                        {
                            continue;
                        }
                        var rc = constructor.Invoke(parameters);
                        rc = ProcessModifiers(rc, returnModifiers);
                        return Newtonsoft.Json.JsonConvert.SerializeObject(rc, GeometryResolver.Settings(7));
                    }
                }
            }

            return "";
        }
    }

    class PointResolver : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(Rhino.Geometry.Point3d);
        }

        public override bool CanRead => true;
        public override bool CanWrite => false;

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.StartArray)
            {
                var token = Newtonsoft.Json.Linq.JToken.Load(reader);
                List<double> items = token.ToObject<List<double>>();
                return new Rhino.Geometry.Point3d(items[0], items[1], items[2]);
            }
            /*
                            JValue jValue = new JValue(reader.Value);
                            switch (reader.TokenType)
                            {
                                case JsonToken.String:
                                    myCustomType = new MyCustomType((string)jValue);
                                    break;
                                case JsonToken.Date:
                                    myCustomType = new MyCustomType((DateTime)jValue);
                                    break;
                                case JsonToken.Boolean:
                                    myCustomType = new MyCustomType((bool)jValue);
                                    break;
                                case JsonToken.Integer:
                                    int i = (int)jValue;
                                    myCustomType = new MyCustomType(i);
                                    break;
                                default:
                                    Console.WriteLine("Default case");
                                    Console.WriteLine(reader.TokenType.ToString());
                                    break;
                            }
                            */
            return new Rhino.Geometry.Point3d(0, 0, 0);
        }
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }
    }

    class ArchivableDictionaryResolver : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(Rhino.Collections.ArchivableDictionary);
        }

        public override bool CanRead => true;
        public override bool CanWrite => true;

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            string encoded = (string)reader.Value;
            var dh = JsonConvert.DeserializeObject<DictHelper>(encoded);
            return dh.SerializedDictionary;
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            string json = JsonConvert.SerializeObject(new DictHelper((Rhino.Collections.ArchivableDictionary)value));
            writer.WriteValue(json);
        }


        [Serializable]
        class DictHelper : ISerializable
        {
            public Rhino.Collections.ArchivableDictionary SerializedDictionary { get; set; }
            public DictHelper(Rhino.Collections.ArchivableDictionary d) { SerializedDictionary = d; }
            public virtual void GetObjectData(SerializationInfo info, StreamingContext context)
            {
                SerializedDictionary.GetObjectData(info, context);
            }
            protected DictHelper(SerializationInfo info, StreamingContext context)
            {
                Type t = typeof(Rhino.Collections.ArchivableDictionary);
                var constructor = t.GetConstructor(System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance,
                  null, new Type[] { typeof(SerializationInfo), typeof(StreamingContext) }, null);
                SerializedDictionary = constructor.Invoke(new object[] { info, context }) as Rhino.Collections.ArchivableDictionary;
            }
        }
    }

    public class GeometryResolver : DefaultContractResolver
    {
        static int _rhinoVersion = 0;
        static JsonSerializerSettings _settings;
        public static JsonSerializerSettings Settings(int rhinoVersion)
        {
            if (_settings == null || rhinoVersion != _rhinoVersion)
            {
                _settings = new JsonSerializerSettings { ContractResolver = new GeometryResolver() };
                _rhinoVersion = rhinoVersion;
                // return V7 ON_Objects for now
                var options = new Rhino.FileIO.SerializationOptions();
                options.RhinoVersion = rhinoVersion;
                options.WriteUserData = true;
                _settings.Context = new System.Runtime.Serialization.StreamingContext(System.Runtime.Serialization.StreamingContextStates.All, options);
                _settings.Converters.Add(new ArchivableDictionaryResolver());
            }
            return _settings;
        }

        protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
        {
            JsonProperty property = base.CreateProperty(member, memberSerialization);
            if (property.DeclaringType == typeof(Rhino.Geometry.Circle))
            {
                property.ShouldSerialize = _ =>
                {
                    return property.PropertyName != "IsValid" && property.PropertyName != "BoundingBox" && property.PropertyName != "Diameter" && property.PropertyName != "Circumference";
                };

            }
            if (property.DeclaringType == typeof(Rhino.Geometry.Plane))
            {
                property.ShouldSerialize = _ =>
                {
                    return property.PropertyName != "IsValid" && property.PropertyName != "OriginX" && property.PropertyName != "OriginY" && property.PropertyName != "OriginZ";
                };
            }

            if (property.DeclaringType == typeof(Rhino.Geometry.Point3f) ||
                property.DeclaringType == typeof(Rhino.Geometry.Point2f) ||
                property.DeclaringType == typeof(Rhino.Geometry.Vector2f) ||
                property.DeclaringType == typeof(Rhino.Geometry.Vector3f))
            {
                property.ShouldSerialize = _ =>
                {
                    return property.PropertyName == "X" || property.PropertyName == "Y" || property.PropertyName == "Z";
                };
            }

            if(property.DeclaringType == typeof(Rhino.Geometry.Line))
            {
                property.ShouldSerialize = _ =>
                {
                    return property.PropertyName == "From" || property.PropertyName == "To";
                };
            }

            if (property.DeclaringType == typeof(Rhino.Geometry.MeshFace))
            {
                property.ShouldSerialize = _ =>
                {
                    return property.PropertyName != "IsTriangle" && property.PropertyName != "IsQuad";
                };
            }
            return property;
        }
    }

}
