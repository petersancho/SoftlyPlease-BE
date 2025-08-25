﻿using System;
using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Serilog;

namespace compute.geometry
{
    public class Startup
    {
        //https://github.com/mcneel/rhino/blob/e1192835cbf03f662d0cf857ee9239b84109eeed/src4/rhino4/Plug-ins/RhinoCodePlugins/RhinoCodePlugin/AssemblyInfo.cs
        static readonly Guid s_rhinoCodePluginId = new Guid("c9cba87a-23ce-4f15-a918-97645c05cde7");

        //https://github.com/mcneel/rhino/blob/8.x/src4/rhino4/Plug-ins/Commands/Properties/AssemblyInfo.cs
        static readonly Guid s_rhinoCommandsPluginId = new Guid("02bf604d-799c-4cc2-830e-8d72f21b14b7");

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddDefaultPolicy(
                    builder =>
                    {
                        builder.AllowAnyOrigin().AllowAnyHeader();
                    });
            });
            services.AddHealthChecks();
            services.AddCarter();
        }

        public void Configure(IApplicationBuilder app)
        {
            RhinoCoreStartup();

            app.UseRouting();
            app.UseCors();
            app.UseEndpoints(builder =>
            {
                builder.MapHealthChecks("/healthcheck");
                builder.MapCarter();
            });
        }

        void RhinoCoreStartup()
        {
            Program.RhinoCore = new Rhino.Runtime.InProcess.RhinoCore(null, Rhino.Runtime.InProcess.WindowStyle.NoWindow);

            if (Config.Debug)
                Rhino.RhinoApp.SendWriteToConsole = true;
            
            Environment.SetEnvironmentVariable("RHINO_TOKEN", null, EnvironmentVariableTarget.Process);
            Rhino.Runtime.HostUtils.OnExceptionReport += (source, ex) =>
            {
                Log.Error(ex, "An exception occurred while processing request");
                Logging.LogExceptionData(ex);
            };

            // NOTE:
            // andyopayne 11/19/2024 (RH-84777)
            // The commands.rhp needs to be loaded so that some features suchs as the gltf exporter will work.
            // This is a temporary solution until the gltf exporter is moved into Rhinocommon or Rhino.UI
            Log.Information("(1/4) Loading rhino commands plugin");
            if (Rhino.PlugIns.PlugIn.LoadPlugIn(s_rhinoCommandsPluginId))
            {
                Log.Information("Successfully loaded commands plugin");
            }
            else
            {
                Log.Error("Error loading rhino commands plugin.");
            }

            // NOTE:
            // eirannejad 10/02/2024 (COMPUTE-268)
            // Ensure RhinoCode plugin (Rhino plugin) is loaded. This plugin registers scripting
            // languages and starts the scripting server that communicates with rhinocode CLI. It also makes
            // the ScriptEditor and RhinoCodeLogs commands available.
            // For Rhino.Compute use cases, the ScriptEditor and rhinocode CLI are not going to be used.
            // The first time a Grasshopper definition with any scripting component on it is passed to Compute,
            // the script environments (especially python 3) will be initialized. This increases the execution
            // time on the first run on any script component. However after that the script components should run
            // normally. The scripting environment will only re-initialize when a new version of Rhino is installed.
            // eirannejad 12/3/2024 (COMPUTE-268)
            // This load is placed before Grasshopper in case GH needs to load any plugins published by the
            // new scripting tools in Rhino >= 8
            Log.Information("(2/4) Loading rhino scripting plugin");
            if (Rhino.PlugIns.PlugIn.LoadPlugIn(s_rhinoCodePluginId))
            {
                Log.Information("Successfully loaded scripting plugin");

                // eirannejad 12/3/2024 (COMPUTE-268)
                // now configuring scripting env to avoid using rhino progressbar and
                // dump init and package install messages to Rhino.RhinoApp.Write
                if (Rhino.RhinoApp.GetPlugInObject(s_rhinoCodePluginId) is object rhinoCodeController)
                {
                    ((dynamic)rhinoCodeController).SendReportsToConsole = true;
                    Log.Information("Configured scripting plugin for compute");
                }
            }
            // If plugin load fails, let compute run, but log the error
            else
            {
                Log.Error("Error loading rhino scripting plugin. Grasshopper script components are going to fail");
            }

            // Load GH at startup so it can get initialized on the main thread
            Log.Information("(3/4) Loading grasshopper");
            var pluginObject = Rhino.RhinoApp.GetPlugInObject("Grasshopper");
            var runheadless = pluginObject?.GetType().GetMethod("RunHeadless");
            if (runheadless != null)
                runheadless.Invoke(pluginObject, null);


            Log.Information("(4/4) Loading compute plug-ins");
            var loadComputePlugins = typeof(Rhino.PlugIns.PlugIn).GetMethod("LoadComputeExtensionPlugins");
            if (loadComputePlugins != null)
                loadComputePlugins.Invoke(null, null);

        }

    }
}
