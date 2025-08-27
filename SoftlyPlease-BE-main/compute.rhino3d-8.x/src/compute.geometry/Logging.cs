﻿using System.Collections.Generic;
using System.IO;
using Serilog;
using Serilog.Events;
using Serilog.Templates;

namespace compute.geometry
{
    static class Logging
    {
        static bool _enabled = false;
        public static List<string> Warnings { get; set; }
        public static List<string> Errors { get; set; }

        /// <summary>
        /// Initialises globally-shared logger.
        /// </summary>
        public static void Init()
        {
            if (_enabled)
                return;
            if (Warnings == null)
                Warnings = new List<string>();
            if (Errors == null)
                Errors = new List<string>();

            var path = Path.Combine(Config.LogPath, "log-compute-geometry-.txt"); // log-geometry-20180925.txt, etc.
            var limit = Config.LogRetainDays;
            var level = Config.Debug ? LogEventLevel.Debug : LogEventLevel.Information;

            var logger = new LoggerConfiguration()
                .MinimumLevel.Is(level)
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .WriteTo.Console(outputTemplate: "CG {Port} [{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
                .WriteTo.File(new ExpressionTemplate("CG {Port} [{@t:HH:mm:ss} {@l:u3}] {@m}\n{@x}"), path, rollingInterval: RollingInterval.Day, retainedFileCountLimit: limit);

            Log.Logger = logger.CreateLogger();

            // log warnings if deprecated env vars used
            foreach (var msg in Config.GetDeprecationWarnings())
                Log.Warning(msg);

            Log.Debug("Logging to {LogPath}", Path.GetDirectoryName(path));

            _enabled = true;
        }

        internal static void LogExceptionData(System.Exception ex)
        {
            if (Errors != null)
                Errors.Add(ex.Message);
            //if (!Config.Debug)
            //    return;
            if (ex?.Data != null)
            {
                // TODO: skip useless keys once we figure out what those are
                foreach (var key in ex.Data.Keys)
                {
                    Log.Debug($"{key} : {{Data}}", ex.Data[key]);
                }
            }
        }
    }
}
