﻿using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Rhino.Geometry;

namespace Resthopper.IO
{
    public class Schema
    {
        public Schema() {}

        [JsonProperty(PropertyName = "absolutetolerance", DefaultValueHandling = DefaultValueHandling.Ignore)]
        public double AbsoluteTolerance { get; set; } = 0;

        [JsonProperty(PropertyName = "angletolerance", DefaultValueHandling = DefaultValueHandling.Ignore)]
        public double AngleTolerance { get; set; } = 0;

        [JsonProperty(PropertyName = "modelunits")]
        public string ModelUnits { get; set; } = Rhino.UnitSystem.Millimeters.ToString();

        // Rhino version of data to be serialized and returned to the client
        [JsonProperty(PropertyName = "dataversion")]
        public int DataVersion { get; set; } = 7;

        [JsonProperty(PropertyName = "algo")]
        public string Algo { get; set; }

        [JsonProperty(PropertyName = "filename")]
        public string FileName { get; set; }

        [JsonProperty(PropertyName = "pointer")]
        public string Pointer { get; set; }

        // If true on input, the solve results are cached based on this schema.
        // When true the cache is searched for already computed results and used
        [JsonProperty(PropertyName = "cachesolve")]
        public bool CacheSolve { get; set; } = false;

        // Used for nested calls
        [JsonProperty(PropertyName = "recursionlevel", DefaultValueHandling = DefaultValueHandling.Ignore)]
        public int RecursionLevel { get; set; } = 0;

        [JsonProperty(PropertyName = "values")]
        public List<DataTree<ResthopperObject>> Values { get; set; } = new List<DataTree<ResthopperObject>>();

        // Return warnings from GH
        [JsonProperty(PropertyName = "warnings", DefaultValueHandling = DefaultValueHandling.Ignore)]
        public List<string> Warnings { get; set; } = new List<string>();

        // Return errors from GH
        [JsonProperty(PropertyName = "errors", DefaultValueHandling = DefaultValueHandling.Ignore)]
        public List<string> Errors { get; set; } = new List<string>();
    }

    public class IoQuerySchema
    {
        [JsonProperty(PropertyName = "requestedFile")]
        public string RequestedFile { get; set; }

    }

    public class IoParamSchema
    {
        public string Name { get; set; }
        public string Nickname { get; set; }
        public string ParamType { get; set; }
    }

    public class InputParamSchema : IoParamSchema
    {
        public string Description { get; set; }
        public int AtLeast { get; set; } = 1;
        public int AtMost { get; set; } = int.MaxValue;
        public bool TreeAccess { get; set; } = false;
        public object Default { get; set; } = null;
        public object Minimum { get; set; } = null;
        public object Maximum { get; set; } = null;
    }

    public class IoResponseSchema
    {
        public string Description { get; set; }
        public string FileName { get; set; }
        public string CacheKey { get; set; }
        public List<string> InputNames { get; set; }
        public List<string> OutputNames { get; set; }
        public string Icon { get; set; }
        public List<InputParamSchema> Inputs { get; set; }
        public List<IoParamSchema> Outputs { get; set; }
        public List<string> Warnings { get; set; } = new List<string>();
        public List<string> Errors { get; set; } = new List<string>();
    }

    public class HTTPRecord
    {
        public HTTPRecord()
        {

        }
        public string IORequest { get; set; }
        public string IOResponse { get; set; }
        public string SolveRequest { get; set; }
        public string SolveResponse { get; set; }
        public Schema Schema { get; set; }
        public IoResponseSchema IOResponseSchema { get; set; }
    }

    public class ResthopperObject : IEquatable<ResthopperObject>
    {
        [JsonProperty(PropertyName = "type")]
        public string Type { get; set; }

        [JsonProperty(PropertyName = "data")]
        public string Data { get; set; }

        [JsonIgnore]
        public object ResolvedData { get; set; }

        [JsonConstructor]
        public ResthopperObject()
        {
        }

        public ResthopperObject(object obj)
        {
            if(obj is GeometryBase geometry)
            {
                Data = geometry.ToJSON(new Rhino.FileIO.SerializationOptions() { RhinoVersion = 7});
            }
            else
            {
#if COMPUTE_CORE
                Data = JsonConvert.SerializeObject(obj, compute.geometry.GeometryResolver.Settings);
#else
                Data = JsonConvert.SerializeObject(obj);//, compute.geometry.GeometryResolver.Settings);
#endif
            }
            Type = obj.GetType().FullName;
        }

        public bool Equals(ResthopperObject other)
        {
            return string.Equals(Type, other.Type) && string.Equals(Data, other.Data);
        }
    }
}
