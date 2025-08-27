﻿//using System;
//using System.IO;
//using System.Net;
//using System.Collections.Generic;

//using Rhino.Geometry;

//using Grasshopper.Kernel;
//using Grasshopper.Kernel.Data;
//using Grasshopper.Kernel.Parameters;
//using Grasshopper.Kernel.Special;
//using Grasshopper.Kernel.Types;
//using GH_IO.Serialization;

//using System.Linq;
//using Resthopper.IO;
//using Newtonsoft.Json;

//namespace compute.geometry
//{
//    class GrasshopperDefinition
//    {
//        public static GrasshopperDefinition FromUrl(string url, bool cache)
//        {
//            var archive = ArchiveFromUrl(url);
//            if (archive == null)
//                return null;

//            GrasshopperDefinition rc = Construct(archive);
//            return rc;
//        }

//        public static GrasshopperDefinition FromBase64String(string data)
//        {
//            var archive = ArchiveFromBase64String(data);
//            if (archive == null)
//                return null;

//            var rc = Construct(archive);
//            return rc;
//        }

//        private static GrasshopperDefinition Construct(GH_Archive archive)
//        {
//            var definition = new GH_Document();
//            if (!archive.ExtractObject(definition, "Definition"))
//                throw new Exception("Unable to extract definition from archive");

//            GrasshopperDefinition rc = new GrasshopperDefinition(definition);
//            foreach( var obj in definition.Objects)
//            {
//                var group = obj as GH_Group;
//                if (group == null)
//                    continue;

//                string nickname = group.NickName;
//                var groupObjects = group.Objects();
//                if ( nickname.Contains("RH_IN") && groupObjects.Count>0)
//                {
//                    var param = groupObjects[0] as IGH_Param;
//                    if (param != null)
//                    {
//                        rc._input[nickname] = new InputGroup(param);
//                    }
//                }

//                if (nickname.Contains("RH_OUT") && groupObjects.Count > 0)
//                {
//                    var param = groupObjects[0] as IGH_Param;
//                    if (param != null)
//                    {
//                        rc._output[nickname] = param;
//                    }
//                }
//            }
//            return rc;
//        }

//        private GrasshopperDefinition(GH_Document definition)
//        {
//            Definition = definition;
//        }

//        public GH_Document Definition { get; }
//        public bool InDataCache { get; set; }
//        Dictionary<string, InputGroup> _input = new Dictionary<string, InputGroup>();
//        Dictionary<string, IGH_Param> _output = new Dictionary<string, IGH_Param>();

//        public void SetInputs(List<DataTree<ResthopperObject>> values)
//        {
//            foreach (var tree in values)
//            {
//                if( !_input.TryGetValue(tree.ParamName, out var inputGroup))
//                {
//                    continue;
//                }

//                if (inputGroup.AlreadySet(tree))
//                {
//                    continue;
//                }

//                inputGroup.CacheTree(tree);
//                inputGroup.Param.VolatileData.Clear();
//                inputGroup.Param.ExpireSolution(true);

//                if (inputGroup.Param is Param_Point)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Point3d rPt = JsonConvert.DeserializeObject<Rhino.Geometry.Point3d>(restobj.Data);
//                            GH_Point data = new GH_Point(rPt);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Vector)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Vector3d rhVector = JsonConvert.DeserializeObject<Rhino.Geometry.Vector3d>(restobj.Data);
//                            GH_Vector data = new GH_Vector(rhVector);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Integer)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            int rhinoInt = JsonConvert.DeserializeObject<int>(restobj.Data);
//                            GH_Integer data = new GH_Integer(rhinoInt);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Number)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            double rhNumber = JsonConvert.DeserializeObject<double>(restobj.Data);
//                            GH_Number data = new GH_Number(rhNumber);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_String)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            string rhString = restobj.Data;
//                            GH_String data = new GH_String(rhString);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Line)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Line rhLine = JsonConvert.DeserializeObject<Rhino.Geometry.Line>(restobj.Data);
//                            GH_Line data = new GH_Line(rhLine);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Curve)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            GH_Curve ghCurve;
//                            try
//                            {
//                                Rhino.Geometry.Polyline data = JsonConvert.DeserializeObject<Rhino.Geometry.Polyline>(restobj.Data);
//                                Rhino.Geometry.Curve c = new Rhino.Geometry.PolylineCurve(data);
//                                ghCurve = new GH_Curve(c);
//                            }
//                            catch
//                            {
//                                var dict = JsonConvert.DeserializeObject<Dictionary<string, string>>(restobj.Data);
//                                var c = (Rhino.Geometry.Curve)Rhino.Runtime.CommonObject.FromJSON(dict);
//                                ghCurve = new GH_Curve(c);
//                            }
//                            inputGroup.Param.AddVolatileData(path, i, ghCurve);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Circle)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Circle rhCircle = JsonConvert.DeserializeObject<Rhino.Geometry.Circle>(restobj.Data);
//                            GH_Circle data = new GH_Circle(rhCircle);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Plane)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Plane rhPlane = JsonConvert.DeserializeObject<Rhino.Geometry.Plane>(restobj.Data);
//                            GH_Plane data = new GH_Plane(rhPlane);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Rectangle)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Rectangle3d rhRectangle = JsonConvert.DeserializeObject<Rhino.Geometry.Rectangle3d>(restobj.Data);
//                            GH_Rectangle data = new GH_Rectangle(rhRectangle);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Box)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Box rhBox = JsonConvert.DeserializeObject<Rhino.Geometry.Box>(restobj.Data);
//                            GH_Box data = new GH_Box(rhBox);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Surface)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Surface rhSurface = JsonConvert.DeserializeObject<Rhino.Geometry.Surface>(restobj.Data);
//                            GH_Surface data = new GH_Surface(rhSurface);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Brep)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Brep rhBrep = JsonConvert.DeserializeObject<Rhino.Geometry.Brep>(restobj.Data);
//                            GH_Brep data = new GH_Brep(rhBrep);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Mesh)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            Rhino.Geometry.Mesh rhMesh = JsonConvert.DeserializeObject<Rhino.Geometry.Mesh>(restobj.Data);
//                            GH_Mesh data = new GH_Mesh(rhMesh);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is GH_NumberSlider)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            double rhNumber = JsonConvert.DeserializeObject<double>(restobj.Data);
//                            GH_Number data = new GH_Number(rhNumber);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is Param_Boolean || inputGroup.Param is GH_BooleanToggle)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            bool boolean = JsonConvert.DeserializeObject<bool>(restobj.Data);
//                            GH_Boolean data = new GH_Boolean(boolean);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }

//                if (inputGroup.Param is GH_Panel)
//                {
//                    foreach (KeyValuePair<string, List<ResthopperObject>> entree in tree)
//                    {
//                        GH_Path path = new GH_Path(GhPath.FromString(entree.Key));
//                        for (int i = 0; i < entree.Value.Count; i++)
//                        {
//                            ResthopperObject restobj = entree.Value[i];
//                            string rhString = JsonConvert.DeserializeObject<string>(restobj.Data);
//                            GH_String data = new GH_String(rhString);
//                            inputGroup.Param.AddVolatileData(path, i, data);
//                        }
//                    }
//                    continue;
//                }
//            }

//        }

//        public Schema Solve()
//        {
//            Schema outputSchema = new Schema();
//            outputSchema.DataVersion = 8;
//            outputSchema.Algo = "";

//            foreach(var kvp in _output)
//            {
//                var param = kvp.Value;
//                if (param == null)
//                    continue;
//                try
//                {
//                    param.CollectData();
//                    param.ComputeData();
//                }
//                catch (Exception)
//                {
//                    param.Phase = GH_SolutionPhase.Failed;
//                    // TODO: throw something better
//                    throw;
//                }

//                // Get data
//                var outputTree = new DataTree<ResthopperObject>();
//                outputTree.ParamName = kvp.Key;

//                var volatileData = param.VolatileData;
//                for (int p = 0; p < volatileData.PathCount; p++)
//                {
//                    var resthopperObjectList = new List<ResthopperObject>();
//                    foreach (var goo in volatileData.get_Branch(p))
//                    {
//                        if (goo == null)
//                            continue;

//                        switch (goo)
//                        {
//                            case GH_Boolean ghValue:
//                                {
//                                    bool rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<bool>(rhValue));
//                                }
//                                break;
//                            case GH_Point ghValue:
//                                {
//                                    Point3d rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Point3d>(rhValue));
//                                }
//                                break;
//                            case GH_Vector ghValue:
//                                {
//                                    Vector3d rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Vector3d>(rhValue));
//                                }
//                                break;
//                            case GH_Integer ghValue:
//                                {
//                                    int rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<int>(rhValue));
//                                }
//                                break;
//                            case GH_Number ghValue:
//                                {
//                                    double rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<double>(rhValue));
//                                }
//                                break;
//                            case GH_String ghValue:
//                                {
//                                    string rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<string>(rhValue));
//                                }
//                                break;
//                            case GH_Line ghValue:
//                                {
//                                    Line rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Line>(rhValue));
//                                }
//                                break;
//                            case GH_Curve ghValue:
//                                {
//                                    Curve rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Curve>(rhValue));
//                                }
//                                break;
//                            case GH_Circle ghValue:
//                                {
//                                    Circle rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Circle>(rhValue));
//                                }
//                                break;
//                            case GH_Plane ghValue:
//                                {
//                                    Plane rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Plane>(rhValue));
//                                }
//                                break;
//                            case GH_Rectangle ghValue:
//                                {
//                                    Rectangle3d rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Rectangle3d>(rhValue));
//                                }
//                                break;
//                            case GH_Box ghValue:
//                                {
//                                    Box rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Box>(rhValue));
//                                }
//                                break;
//                            case GH_Surface ghValue:
//                                {
//                                    Brep rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Brep>(rhValue));
//                                }
//                                break;
//                            case GH_Brep ghValue:
//                                {
//                                    Brep rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Brep>(rhValue));
//                                }
//                                break;
//                            case GH_Mesh ghValue:
//                                {
//                                    Mesh rhValue = ghValue.Value;
//                                    resthopperObjectList.Add(GetResthopperObject<Mesh>(rhValue));
//                                }
//                                break;
//                        }
//                    }

//                    GhPath path = new GhPath(new int[] { p });
//                    outputTree.Add(path.ToString(), resthopperObjectList);
//                }

//                outputSchema.Values.Add(outputTree);
//            }


//            if (outputSchema.Values.Count < 1)
//                throw new System.Exceptions.PayAttentionException("Looks like you've missed something..."); // TODO

//            return outputSchema;
//        }

//        public static GH_Archive ArchiveFromUrl(string url)
//        {
//            if (string.IsNullOrWhiteSpace(url))
//                return null;

//            if( System.IO.File.Exists(url))
//            {
//                var localArchive = new GH_Archive();
//                if (localArchive.ReadFromFile(url))
//                    return localArchive;
//            }

//            byte[] byteArray = null;
//            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
//            request.AutomaticDecompression = DecompressionMethods.GZip;
//            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
//            using (var stream = response.GetResponseStream())
//            using (var memStream = new MemoryStream())
//            {
//                stream.CopyTo(memStream);
//                byteArray = memStream.ToArray();
//            }

//            try
//            {
//                var byteArchive = new GH_Archive();
//                if (byteArchive.Deserialize_Binary(byteArray))
//                    return byteArchive;
//            }
//            catch (Exception) { }

//            var grasshopperXml = StripBom(System.Text.Encoding.UTF8.GetString(byteArray));
//            var xmlArchive = new GH_Archive();
//            if (xmlArchive.Deserialize_Xml(grasshopperXml))
//                return xmlArchive;

//            return null;
//        }

//        public static GH_Archive ArchiveFromBase64String(string blob)
//        {
//            if (string.IsNullOrWhiteSpace(blob))
//                return null;

//            byte[] byteArray = Convert.FromBase64String(blob);
//            try
//            {
//                var byteArchive = new GH_Archive();
//                if (byteArchive.Deserialize_Binary(byteArray))
//                    return byteArchive;
//            }
//            catch (Exception) { }

//            var grasshopperXml = StripBom(System.Text.Encoding.UTF8.GetString(byteArray));
//            var xmlArchive = new GH_Archive();
//            if (xmlArchive.Deserialize_Xml(grasshopperXml))
//                return xmlArchive;

//            return null;
//        }

//        // strip bom from string -- [239, 187, 191] in byte array == (char)65279
//        // https://stackoverflow.com/a/54894929/1902446
//        static string StripBom(string str)
//        {
//            if (!string.IsNullOrEmpty(str) && str[0] == (char)65279)
//                str = str.Substring(1);
//            return str;
//        }

//        static ResthopperObject GetResthopperObject<T>(object goo)
//        {
//            var v = (T)goo;
//            ResthopperObject rhObj = new ResthopperObject();
//            rhObj.Type = goo.GetType().FullName;
//            //rhObj.Data = JsonConvert.SerializeObject(v);//, GeometryResolver.Settings);

//            if (v is GeometryBase geometry)
//                rhObj.Data = geometry.ToJSON(new Rhino.FileIO.SerializationOptions());
//            else
//                rhObj.Data = JsonConvert.SerializeObject(v);
            
//            return rhObj;
//        }


//        class InputGroup
//        {
//            public InputGroup(IGH_Param param)
//            {
//                Param = param;
//            }
//            public IGH_Param Param { get; }
            
//            public bool AlreadySet(DataTree<ResthopperObject> tree)
//            {
//                if (_tree == null)
//                    return false;

//                var oldDictionary = _tree.InnerTree;
//                var newDictionary = tree.InnerTree;

//                if (!oldDictionary.Keys.SequenceEqual(newDictionary.Keys))
//                {
//                    return false;
//                }

//                foreach (var kvp in oldDictionary)
//                {
//                    var oldValue = kvp.Value;
//                    if (!newDictionary.TryGetValue(kvp.Key, out List<ResthopperObject> newValue))
//                        return false;

//                    if (!newValue.SequenceEqual(oldValue))
//                    {
//                        return false;
//                    }
//                }

//                return true;
//            }

//            public void CacheTree(DataTree<ResthopperObject> tree)
//            {
//                _tree = tree;
//            }

//            DataTree<ResthopperObject> _tree;
//        }
//    }
//}

//namespace System.Exceptions
//{
//    public class PayAttentionException : Exception
//    {
//        public PayAttentionException(string m) : base(m)
//        {

//        }

//    }
//}
