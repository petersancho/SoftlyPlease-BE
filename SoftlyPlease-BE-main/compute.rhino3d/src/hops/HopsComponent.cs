﻿using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using GH_IO.Serialization;
using Grasshopper.GUI;
using Grasshopper.GUI.Canvas;
using Grasshopper.Kernel;
using Grasshopper.Kernel.Attributes;
using Resthopper.IO;
using Newtonsoft.Json;
using Rhino.Geometry;
using System.Threading.Tasks;
using System.IO;
using Grasshopper.Kernel.Types;
using Grasshopper.Kernel.Data;
using Rhino;
using System.Drawing;
using Grasshopper;
using Grasshopper.Kernel.Expressions;
using Serilog.Events;
using Serilog.Templates;
using Serilog;
using System.Linq;

namespace Hops
{
    public class HopsLog : GH_AssemblyPriority
    {
        public static ILogger Log { get; private set; }
        public override GH_LoadingInstruction PriorityLoad()
        {
            Config.Load();

            var date = System.DateTime.Now;
            var path = System.IO.Path.Combine(Config.LogPath, $"log-hops-inside-{System.Diagnostics.Process.GetCurrentProcess().ProcessName}-{date:yyyyMMdd}.txt");
            var limit = Config.LogRetainDays;
            var level = Config.Debug ? LogEventLevel.Debug : LogEventLevel.Information;

            var loggerConfig = new LoggerConfiguration()
            .MinimumLevel.Is(level)
            .WriteTo.File(new ExpressionTemplate("HC   [{@t:HH:mm:ss} {@l:u3}] {@m}\n{@x}"), path);
            Log = loggerConfig.CreateLogger();

            Log.Information($"Hops logging started at {DateTime.Now.ToLocalTime()}");

            return GH_LoadingInstruction.Proceed;
        }
    }

    [Guid("C69BB52C-88BA-4640-B69F-188D111029E8")]
    public class HopsComponent : GH_TaskCapableComponent<Schema>, IGH_VariableParameterComponent
    {
        #region Fields
        int _majorVersion = 0;
        int _minorVersion = 1;
        RemoteDefinition _remoteDefinition = null;
        bool _cacheResultsInMemory = true;
        bool _cacheResultsOnServer = true;
        bool _remoteDefinitionRequiresRebuild = false;
        bool _synchronous = true;
        bool _showEnabledInput = false;
        bool _enabledThisSolve = true;
        bool _showPathInput = false;
        int _iteration = 0;

        SolveDataList _workingSolveList;
        int _solveSerialNumber = 0;
        int _solveRecursionLevel = 0;
        Schema _lastCreatedSchema = null;
        static bool _isHeadless = false;
        static int _currentSolveSerialNumber = 1;
        #endregion

        static HopsComponent()
        {
            if (!Rhino.Runtime.HostUtils.RunningOnWindows)
                return;
            if (Rhino.RhinoApp.IsRunningHeadless)
                return;
            if (Hops.HopsAppSettings.Servers.Length > 0)
                return;
            if (Hops.HopsAppSettings.LaunchWorkerAtStart)
            {
                Servers.StartServerOnLaunch();
            }
        }

        public HopsComponent()
          : base("Hops", "Hops", "Solve an external definition using Rhino Compute", "Params", "Util")
        {
            _isHeadless = Rhino.RhinoApp.IsRunningHeadless;
        }

        public override Guid ComponentGuid => GetType().GUID;
        public override GH_Exposure Exposure => GH_Exposure.tertiary;

        protected override string HtmlHelp_Source()
        {
            return "GOTO:https://developer.rhino3d.com/guides/compute/hops-component/";
        }

        protected override void RegisterInputParams(GH_InputParamManager pManager)
        {
            // Nothing to do here. Inputs and outputs are dynamically created
        }

        protected override void RegisterOutputParams(GH_OutputParamManager pManager)
        {
            // Nothing to do here. Inputs and outputs are dynamically created
        }

        protected override void BeforeSolveInstance()
        {
            Message = "";
            _enabledThisSolve = true;
            _lastCreatedSchema = null;
            _solveRecursionLevel = 0;

            if (_isHeadless &&
                    OnPingDocument() is GH_Document doc)
            {
                if (doc.ConstantServer.TryGetValue("ComputeRecursionLevel", out GH_Variant recursionLevel))
                    // compute will set the ComputeRecursionLevel 
                    _solveRecursionLevel = recursionLevel._Int;
                else
                    _solveRecursionLevel = HopsAppSettings.RecursionLimit;
            }

            if (!_solvedCallback)
            {
                _solveSerialNumber = _currentSolveSerialNumber++;
                if (_workingSolveList != null)
                    _workingSolveList.Canceled = true;
                _workingSolveList = new SolveDataList(_solveSerialNumber, this, _remoteDefinition, _cacheResultsInMemory);
            }

            base.BeforeSolveInstance();
        }

        bool _solvedCallback = false;
        public void OnWorkingListComplete()
        {
            _solvedCallback = true;
            if (_workingSolveList.SolvedFor(_solveSerialNumber))
            {
                ExpireSolution(true);
            }
            _solvedCallback = false;
        }

        public int SolveSerialNumber => _solveSerialNumber;

        HTTPRecord _httpRecord;
        public HTTPRecord HTTPRecord
        {
            get
            {
                if (_httpRecord == null)
                    _httpRecord = new HTTPRecord();
                return _httpRecord; 
            }
        }

        protected override void SolveInstance(IGH_DataAccess DA)
        {
            if (!_enabledThisSolve)
                return;
            _iteration++;

            // Limit recursive calls on compute
            if (_isHeadless && _solveRecursionLevel > HopsAppSettings.RecursionLimit)
            {
                // Don't allow hops components to run on compute for now. Recursive calls will lock
                HopsAddRuntimeMessage(
                    GH_RuntimeMessageLevel.Error,
                    $"Hops recursion level beyond limit of {HopsAppSettings.RecursionLimit}. Please help us understand why you need this by emailing steve@mcneel.com");
                return;

            }

            if (_showPathInput && DA.Iteration == 0)
            {
                string path = "";
                if (!DA.GetData("_Path", ref path))
                {
                    HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Warning, "No URL or path defined for definition");
                    return;
                }

                if (!string.Equals(path, RemoteDefinitionLocation))
                {
                    RebuildWithNewPathAndRecompute(path);
                    return;
                }
            }

            if (string.IsNullOrWhiteSpace(RemoteDefinitionLocation)  && _remoteDefinition?.InternalizedDefinition == null)
            {
                HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Warning, "No URL or path defined for definition");
                return;
            }

            if (_showEnabledInput && DA.Iteration == 0)
            {
                bool enabled = true;
                if (DA.GetData("_Enabled", ref enabled) && enabled == false)
                {
                    _enabledThisSolve = false;
                    return;
                }
            }

            if (InPreSolve)
            {
                if (_workingSolveList.SolvedFor(_solveSerialNumber))
                {
                    var solvedTask = Task.FromResult(_workingSolveList.SolvedSchema(DA.Iteration));
                    TaskList.Add(solvedTask);
                    return;
                }

                List<string> warnings;
                List<string> errors;
                var inputSchema = _remoteDefinition.CreateSolveInput(DA, _cacheResultsOnServer, _solveRecursionLevel, out warnings, out errors);
                if (warnings != null && warnings.Count > 0)
                {
                    foreach (var warning in warnings)
                    {
                        HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Warning, warning);
                    }
                    return;
                }
                if (errors != null && errors.Count > 0)
                {
                    foreach (var error in errors)
                    {
                        HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, error);
                    }
                    return;
                }
                if (inputSchema != null)
                {
                    if (_lastCreatedSchema==null)
                        _lastCreatedSchema = inputSchema;
                    _workingSolveList.Add(inputSchema);
                }
                return;
            }

            if (TaskList.Count == 0)
            {
                _workingSolveList.StartSolving(_synchronous);
                if (!_synchronous)
                {
                    Message = "solving...";
                    return;
                }
                else
                {
                    for (int i = 0; i < _workingSolveList.Count; i++)
                    {
                        var output = _workingSolveList.SolvedSchema(i);
                        TaskList.Add(Task.FromResult(output));
                    }
                }
            }

            if (!GetSolveResults(DA, out var schema))
            {
                List<string> errors;
                List<string> warnings;
                var inputSchema = _remoteDefinition.CreateSolveInput(DA, _cacheResultsOnServer, _solveRecursionLevel, out warnings, out errors);
                if (warnings != null && warnings.Count > 0)
                {
                    foreach (var warning in warnings)
                    {
                        HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Warning, warning);
                    }
                    return;
                }
                if (errors != null && errors.Count > 0)
                {
                    foreach (var error in errors)
                    {
                        HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, error);
                    }
                    return;
                }
                if (inputSchema != null)
                {
                    schema = _remoteDefinition.Solve(inputSchema, _cacheResultsInMemory);
                    if (_lastCreatedSchema == null)
                        _lastCreatedSchema = inputSchema;
                }
                else
                    schema = null;
            }
            
            if (DA.Iteration == 0)
            {
                // TODO: Having to clear the output data seems like a bug in the
                // TaskCapable components logic. We need to investigate this further.
                foreach (var output in Params.Output)
                    output.ClearData();
            }

            if (schema != null)
            {
                _remoteDefinition.SetComponentOutputs(schema, DA, Params.Output, this);
            }
        }

        const string TagVersion = "RemoteSolveVersion";
        const string TagPath = "RemoteDefinitionLocation";
        const string TagCacheResultsOnServer = "CacheSolveResults";
        const string TagCacheResultsInMemory = "CacheResultsInMemory";
        const string TagSynchronousSolve = "SynchronousSolve";
        const string TagShowEnabled = "ShowInput_Enabled";
        const string TagShowPath = "ShowInput_Path";
        const string TagInternalizeDefinitionFlag = "InternalizeFlag";
        const string TagInternalizeDefinition = "InternalizeDefinition";

        public override bool Write(GH_IWriter writer)
        {
            bool rc = base.Write(writer);
            if (rc)
            {
                writer.SetVersion(TagVersion, _majorVersion, _minorVersion, 0);
                writer.SetString(TagPath, RemoteDefinitionLocation);
                writer.SetBoolean(TagCacheResultsOnServer, _cacheResultsOnServer);
                writer.SetBoolean(TagCacheResultsInMemory, _cacheResultsInMemory);
                writer.SetBoolean(TagSynchronousSolve, _synchronous);
                writer.SetBoolean(TagShowEnabled, _showEnabledInput);
                writer.SetBoolean(TagShowPath, _showPathInput);
                if(_remoteDefinition?.InternalizedDefinition != null)
                {
                    writer.SetByteArray(TagInternalizeDefinition, _remoteDefinition.InternalizedDefinition);
                }
            }
            return rc;
        }
        public override bool Read(GH_IReader reader)
        {
            bool rc = base.Read(reader);
            if (rc)
            {
                var version = reader.GetVersion(TagVersion);
                _majorVersion = version.major;
                _minorVersion = version.minor;
                string path = reader.GetString(TagPath);

                bool cacheResults = _cacheResultsOnServer;
                if (reader.TryGetBoolean(TagCacheResultsOnServer, ref cacheResults))
                    _cacheResultsOnServer = cacheResults;

                cacheResults = _cacheResultsInMemory;
                if (reader.TryGetBoolean(TagCacheResultsInMemory, ref cacheResults))
                    _cacheResultsInMemory = cacheResults;

                bool synchronous = _synchronous;
                if (reader.TryGetBoolean(TagSynchronousSolve, ref synchronous))
                    _synchronous = synchronous;

                bool showEnabled = _showEnabledInput;
                if (reader.TryGetBoolean(TagShowEnabled, ref showEnabled))
                    _showEnabledInput = showEnabled;

                bool showPath = _showPathInput;
                if (reader.TryGetBoolean(TagShowPath, ref showPath))
                    _showPathInput = showPath;

                if(reader.ItemExists(TagInternalizeDefinition))
                {
                    try
                    {
                        byte[] internalizedDefinition = reader.GetByteArray(TagInternalizeDefinition);
                        if(_remoteDefinition == null)
                            _remoteDefinition = RemoteDefinition.Create(null, this);
                        _remoteDefinition.InternalizedDefinition = internalizedDefinition;
                        _remoteDefinition._pathType = RemoteDefinition.PathType.InternalizedDefinition;
                        _remoteDefinition.GetRemoteDescription();
                    }
                    catch(Exception ex)
                    {
                        HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, "Unable to deserialize internalized grasshopper definition. " + ex.Message);
                    }
                }

                // set remote definition location last as it will need all of the
                // previous values to define inputs and outputs
                if (!String.IsNullOrWhiteSpace(path))
                {
                    try
                    {
                        var pathType = RemoteDefinition.GetPathType(path);
                        if (pathType == RemoteDefinition.PathType.GrasshopperDefinition)
                        {
                            if (!File.Exists(path) && !RemoteDefinition.IsWebUrl(path))
                            {
                                HopsLog.Log.Debug($"{path} does not exist. Trying to find it in the same directory as the definition.");
                                // See if the file is in the same directory as this definition. If it
                                // is then use that file. NOTE: This will change the saved path for
                                // for this component when we save the GH definition again. That may or
                                // may not be a problem; I'm not sure yet.
                                string parentDirectory = Path.GetDirectoryName(reader.ArchiveLocation);
                                if (!String.IsNullOrEmpty(parentDirectory) && Directory.Exists(parentDirectory))
                                {
                                    string remoteFileName = Path.GetFileName(path);
                                    if (!string.IsNullOrEmpty(remoteFileName))
                                    {
                                        string filePath = Path.Combine(parentDirectory, remoteFileName);
                                        if (File.Exists(filePath))
                                        {
                                            path = filePath;
                                        }
                                        else
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Warning, $"Remote definition not found: {path}. Check that the file path exists.");
                                        }
                                    }
                                }
                                else
                                {
                                    HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Warning, $"Remote definition not found: {path}. Check that the file path exists.");
                                }
                            }
                        }
                        RemoteDefinitionLocation = path;
                    }
                    catch (System.Net.WebException)
                    {
                        // this can happen if a server is not responding and is acceptable in this
                        // case as we want to read without throwing exceptions
                    }
                }
            }
            return rc;
        }

        public bool CanInsertParameter(GH_ParameterSide side, int index) => false;
        public bool CanRemoveParameter(GH_ParameterSide side, int index) => false;
        public IGH_Param CreateParameter(GH_ParameterSide side, int index) => null;
        public bool DestroyParameter(GH_ParameterSide side, int index) => true;
        public void VariableParameterMaintenance() {}

        protected override System.Drawing.Bitmap Icon
        {
            get
            {
                return Hops24Icon();
            }
        }

        static System.Drawing.Bitmap _hops24Icon;
        static System.Drawing.Bitmap _hops48Icon;
        static System.Drawing.Bitmap Hops24Icon()
        {
            if (_hops24Icon == null)
            {
                var stream = typeof(HopsComponent).Assembly.GetManifestResourceStream("Hops.resources.Hops_24x24.png");
                _hops24Icon = new System.Drawing.Bitmap(stream);
            }
            return _hops24Icon;
        }
        public static System.Drawing.Bitmap Hops48Icon()
        {
            if (_hops48Icon == null)
            {
                var stream = typeof(HopsComponent).Assembly.GetManifestResourceStream("Hops.resources.Hops_48x48.png");
                _hops48Icon = new System.Drawing.Bitmap(stream);
            }
            return _hops48Icon;
        }

        public override void AppendAdditionalMenuItems(ToolStripDropDown menu)
        {
            base.AppendAdditionalMenuItems(menu);

            // remove parallel computing and variable parameters menu items
            // as they aren't useful for this component
            for (int i = menu.Items.Count - 1; i >= 0; i--)
            {
                if (menu.Items[i].Text.Equals("parallel computing", StringComparison.OrdinalIgnoreCase))
                {
                    menu.Items.RemoveAt(i);
                    continue;
                }
                if (menu.Items[i].Text.Equals("variable parameters", StringComparison.OrdinalIgnoreCase))
                {
                    menu.Items.RemoveAt(i);
                    continue;
                }
            }
            
            //remove extra separator from menu
            var separator = menu.Items[menu.Items.Count - 1] as ToolStripSeparator;
            if (separator != null)
                menu.Items.RemoveAt(menu.Items.Count - 1);

            menu.Items.Add(new ToolStripSeparator());

            var tsi = new ToolStripMenuItem("&Path...", null, (sender, e) => { ShowSetDefinitionUi(); });
            if (!_showPathInput)
                tsi.Font = new System.Drawing.Font(tsi.Font, System.Drawing.FontStyle.Bold);
            tsi.Enabled = !_showPathInput;
            menu.Items.Add(tsi);

            tsi = AddFunctionMgrControl();
            if (tsi != null)
                menu.Items.Add(tsi);

            tsi = new ToolStripMenuItem("Internalize Definition", null, (s, e) => {
                if (File.Exists(RemoteDefinitionLocation))
                {
                    _remoteDefinition.InternalizeDefinition(RemoteDefinitionLocation);
                    DefineInputsAndOutputs();                 
                }
            });
            tsi.ToolTipText = "Make the referenced definition permanent and clear any existing source paths";
            if (!File.Exists(RemoteDefinitionLocation))
            {
                tsi.Enabled = false;
            }
            menu.Items.Add(tsi);

            menu.Items.Add(new ToolStripSeparator());

            tsi = new ToolStripMenuItem("Show Input: Path", null, (s, e) => {
                _showPathInput = !_showPathInput;
                DefineInputsAndOutputs();
            });
            tsi.ToolTipText = "Create input for path";
            tsi.Checked = _showPathInput;
            menu.Items.Add(tsi);

            tsi = new ToolStripMenuItem("Show Input: Enabled", null, (s, e) => {
                _showEnabledInput = !_showEnabledInput;
                DefineInputsAndOutputs();
            });
            tsi.ToolTipText = "Create input for enabled";
            tsi.Checked = _showEnabledInput;
            menu.Items.Add(tsi);

            tsi = new ToolStripMenuItem("Asynchronous", null, (s, e) => { _synchronous = !_synchronous; });
            tsi.ToolTipText = "Do not block while solving";
            tsi.Checked = !_synchronous;
            menu.Items.Add(tsi);

            tsi = new ToolStripMenuItem("Cache In Memory", null, (s, e) => { _cacheResultsInMemory = !_cacheResultsInMemory; });
            tsi.ToolTipText = "Keep previous results in memory cache";
            tsi.Checked = _cacheResultsInMemory;
            menu.Items.Add(tsi);

            tsi = new ToolStripMenuItem("Cache On Server", null, (s, e) => { _cacheResultsOnServer = !_cacheResultsOnServer; });
            tsi.ToolTipText = "Tell the compute server to cache results for reuse in the future";
            tsi.Checked = _cacheResultsOnServer;
            menu.Items.Add(tsi);

            var exportTsi = new ToolStripMenuItem("Export");
            exportTsi.Enabled = _remoteDefinition != null;
            menu.Items.Add(exportTsi);
            tsi = new ToolStripMenuItem("Export python sample...", null, (s, e) => { ExportAsPython(); });
            exportTsi.DropDownItems.Add(tsi);

            var restAPITsi = new ToolStripMenuItem("REST API");
            restAPITsi.Enabled = _remoteDefinition != null;
            exportTsi.DropDownItems.Add(restAPITsi);

            tsi = new ToolStripMenuItem("Last IO request...", null, (s, e) => { ExportLastIORequest(); });
            restAPITsi.DropDownItems.Add(tsi);

            tsi = new ToolStripMenuItem("Last IO response...", null, (s, e) => { ExportLastIOResponse(); });
            restAPITsi.DropDownItems.Add(tsi);

            tsi = new ToolStripMenuItem("Last Solve request...", null, (s, e) => { ExportLastSolveRequest(); });
            restAPITsi.DropDownItems.Add(tsi);

            tsi = new ToolStripMenuItem("Last Solve response...", null, (s, e) => { ExportLastSolveResponse(); });
            restAPITsi.DropDownItems.Add(tsi);
        }

        public ToolStripMenuItem AddFunctionMgrControl()
        {
            HopsAppSettings.InitFunctionSources();
            if (HopsAppSettings.FunctionSources.Count <= 0)
                return null;
            ToolStripMenuItem mainMenu = new ToolStripMenuItem("Available Functions", null, null, "Available Functions");
            mainMenu.DropDownItems.Clear();
            foreach (var row in HopsAppSettings.FunctionSources)
            {
                ToolStripMenuItem menuItem = new ToolStripMenuItem(row.SourceName, null, null, row.SourceName);
                GenerateFunctionPathMenu(menuItem, row);
                if (menuItem.DropDownItems.Count > 0)
                    mainMenu.DropDownItems.Add(menuItem);
            }
            //InitThumbnailViewer();
            return mainMenu;
        }

        private void GenerateFunctionPathMenu(ToolStripMenuItem menu, FunctionSourceRow row)
        {
            if (String.IsNullOrEmpty(row.SourceName) || String.IsNullOrEmpty(row.SourcePath))
                return;
            if (row.SourcePath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var getTask = HopsFunctionMgr.HttpClient.GetAsync(row.SourcePath);
                    if (getTask != null)
                    {
                        var responseMessage = getTask.Result;
                        var remoteSolvedData = responseMessage.Content;
                        var stringResult = remoteSolvedData.ReadAsStringAsync().Result;
                        if (string.IsNullOrEmpty(stringResult))
                        {
                            //invalid URL
                            return;
                        }
                        else
                        {
                            var response = JsonConvert.DeserializeObject<FunctionMgr_Schema[]>(stringResult);
                            if (response != null)
                            {
                                UriFunctionPathInfo functionPaths = new UriFunctionPathInfo(row.SourcePath, true);
                                functionPaths.isRoot = true;
                                functionPaths.RootURL = row.SourcePath;
                                if (!String.IsNullOrEmpty(response[0].Uri))
                                {
                                    //If the Schema Uri exists, then the response is likely from the ghhops_server.
                                    //Otherwise, let's assume the response is from the appserver
                                    foreach (FunctionMgr_Schema obj in response)
                                    {
                                        HopsFunctionMgr.SeekFunctionMenuDirs(functionPaths, obj.Uri, obj.Uri, row);
                                    }
                                }
                                else if (!String.IsNullOrEmpty(response[0].Name))
                                {
                                    foreach (FunctionMgr_Schema obj in response)
                                    {
                                        HopsFunctionMgr.SeekFunctionMenuDirs(functionPaths, "/" + obj.Name, "/" + obj.Name, row);
                                    }
                                }
                                if (functionPaths.Paths.Count != 0)
                                    functionPaths.BuildMenus(menu, new MouseEventHandler(tsm_UriClick));
                            }
                        }
                    }
                }
                catch (Exception)
                {
                }
            }
            else if (Directory.Exists(row.SourcePath))
            {
                FunctionPathInfo functionPaths = new FunctionPathInfo(row.SourcePath, true);
                functionPaths.isRoot = true;

                HopsFunctionMgr.SeekFunctionMenuDirs(functionPaths);
                if (functionPaths.Paths.Count != 0)
                {
                    functionPaths.BuildMenus(menu, tsm_FileClick, HopsFunctionMgr.tsm_HoverEnter, HopsFunctionMgr.tsm_HoverExit);
                    functionPaths.RemoveEmptyMenuItems(menu, tsm_FileClick, HopsFunctionMgr.tsm_HoverEnter, HopsFunctionMgr.tsm_HoverExit);
                }
            }
        }

        private void tsm_FileClick(object sender, MouseEventArgs e)
        {
            if (!(sender is ToolStripItem))
                return;
            ToolStripItem ti = sender as ToolStripItem;

            switch (e.Button)
            {
                case MouseButtons.Left:
                    RemoteDefinitionLocation = ti.Name;
                    this.ExpireSolution(true);
                    break;
                case MouseButtons.Right:
                    try
                    {
                        Instances.DocumentEditor.ScriptAccess_OpenDocument(ti.Name);
                    }
                    catch (Exception) { }
                    break;
            }
            
        }

        private void tsm_UriClick(object sender, MouseEventArgs e)
        {
            if (!(sender is ToolStripItem))
                return;
            ToolStripItem ti = sender as ToolStripItem;
            RemoteDefinitionLocation = ti.Tag as string;
            this.ExpireSolution(true);
        }


        /// <summary>
        /// Used for supporting double click on the component. 
        /// </summary>
        class ComponentAttributes : GH_ComponentAttributes
        {
            HopsComponent _component;
            public ComponentAttributes(HopsComponent parentComponent) : base(parentComponent)
            {
                _component = parentComponent;
            }

            protected override void Render(GH_Canvas canvas, System.Drawing.Graphics graphics, GH_CanvasChannel channel)
            {
                base.Render(canvas, graphics, channel);
                if (channel == GH_CanvasChannel.Objects &&
                    GH_Canvas.ZoomFadeMedium > 0 &&
                    !string.IsNullOrWhiteSpace(_component.RemoteDefinitionLocation)
                    )
                {
                    RenderHop(graphics, GH_Canvas.ZoomFadeMedium, new System.Drawing.PointF(Bounds.Right, Bounds.Bottom));
                }
            }

            void RenderHop(System.Drawing.Graphics graphics, int alpha, System.Drawing.PointF anchor)
            {
                var boxHops = new System.Drawing.RectangleF(anchor.X - 16, anchor.Y - 8, 16, 16);
                var bmp = HopsComponent.Hops48Icon();
                graphics.DrawImage(bmp, boxHops);
            }

            public override GH_ObjectResponse RespondToMouseDoubleClick(GH_Canvas sender, GH_CanvasMouseEvent e)
            {
                try
                {
                    _component.ShowSetDefinitionUi();
                }
                catch(Exception ex)
                {
                    _component.HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, ex.Message);
                }
                return base.RespondToMouseDoubleClick(sender, e);
            }
        }

        public override void CreateAttributes()
        {
            Attributes = new ComponentAttributes(this);
        }

        void ShowSetDefinitionUi()
        {
            var form = new SetDefinitionForm(RemoteDefinitionLocation);
            if(form.ShowModal(Grasshopper.Instances.EtoDocumentEditor))
            {
                var comp = Grasshopper.Instances.ComponentServer.FindObjectByName(form.Path, true, true);
                if (comp != null)
                    RemoteDefinitionLocation = comp.Guid.ToString();
                else
                    RemoteDefinitionLocation = form.Path;
            }
        }

        void ExportAsPython()
        {
            if (_lastCreatedSchema == null)
            {
                Eto.Forms.MessageBox.Show("No input created. Run this component at least once", Eto.Forms.MessageBoxType.Error);
                return;
            }

            var dlg = new Eto.Forms.SaveFileDialog();
            dlg.Filters.Add(new Eto.Forms.FileFilter("Python script", ".py"));
            if (dlg.ShowDialog(Grasshopper.Instances.EtoDocumentEditor) == Eto.Forms.DialogResult.Ok)
            {
                string solveUrl = Servers.GetSolveUrl();
                if (solveUrl.EndsWith("grasshopper", StringComparison.InvariantCultureIgnoreCase))
                    solveUrl = solveUrl.Substring(0, solveUrl.Length - "grasshopper".Length);
                var sb = new System.Text.StringBuilder();
                sb.Append(@"# pip install compute_rhino3d and rhino3dm
import compute_rhino3d.Util
import compute_rhino3d.Grasshopper as gh
import rhino3dm
import json

compute_rhino3d.Util.url = '");
                sb.Append(solveUrl);
sb.Append(@"'

# create DataTree for each input
input_trees = []
");

                foreach(var val in _lastCreatedSchema.Values)
                {
                    sb.AppendLine($"tree = gh.DataTree(\"{val.ParamName}\")");
                    foreach (var kv in val.InnerTree)
                    {
                        List<string> values = new List<string>();
                        foreach (var v in kv.Value)
                            values.Add(v.Data);
                        string innerData = JsonConvert.SerializeObject(values);
                        sb.AppendLine($"tree.Append([{kv.Key}], {innerData})");
                        sb.AppendLine("input_trees.append(tree)");
                        sb.AppendLine();
                    }
                }

                sb.AppendLine($"output = gh.EvaluateDefinition('{RemoteDefinitionLocation.Replace("\\", "\\\\")}', input_trees)");
                sb.Append(@"errors = output['errors']
if errors:
    print('ERRORS')
    for error in errors:
        print(error)
warnings = output['warnings']
if warnings:
    print('WARNINGS')
    for warning in warnings:
        print(warning)

values = output['values']
for value in values:
    name = value['ParamName']
    inner_tree = value['InnerTree']
    print(name)
    for path in inner_tree:
        print(path)
        values_at_path = inner_tree[path]
        for value_at_path in values_at_path:
            data = value_at_path['data']
            if isinstance(data, str) and 'archive3dm' in data:
                obj = rhino3dm.CommonObject.Decode(json.loads(data))
                print(obj)
            else:
                print(data)
");
                System.IO.File.WriteAllText(dlg.FileName, sb.ToString());
            }
        }

        void ExportLastIORequest()
        {
            if (String.IsNullOrEmpty(HTTPRecord.IORequest))
            {
                Eto.Forms.MessageBox.Show("No IO request has been made. Run this component at least once", Eto.Forms.MessageBoxType.Error);
                return;
            }
            var dlg = new Eto.Forms.SaveFileDialog();
            dlg.Filters.Add(new Eto.Forms.FileFilter("JSON file", ".json"));
            if (dlg.ShowDialog(Grasshopper.Instances.EtoDocumentEditor) == Eto.Forms.DialogResult.Ok)
            {
                System.IO.File.WriteAllText(dlg.FileName, HTTPRecord.IORequest);
            }
        }

        void ExportLastIOResponse()
        {
            if (String.IsNullOrEmpty(HTTPRecord.IOResponse))
            {
                Eto.Forms.MessageBox.Show("No IO response has been received. Run this component at least once", Eto.Forms.MessageBoxType.Error);
                return;
            }
            var dlg = new Eto.Forms.SaveFileDialog();
            dlg.Filters.Add(new Eto.Forms.FileFilter("JSON file", ".json"));
            if (dlg.ShowDialog(Grasshopper.Instances.EtoDocumentEditor) == Eto.Forms.DialogResult.Ok)
            {
                System.IO.File.WriteAllText(dlg.FileName, HTTPRecord.IOResponse);
            }
        }

        void ExportLastSolveRequest()
        {
            if (String.IsNullOrEmpty(HTTPRecord.SolveRequest))
            {
                Eto.Forms.MessageBox.Show("No solve request has been made. Run this component at least once", Eto.Forms.MessageBoxType.Error);
                return;
            }
            var dlg = new Eto.Forms.SaveFileDialog();
            dlg.Filters.Add(new Eto.Forms.FileFilter("JSON file", ".json"));
            if (dlg.ShowDialog(Grasshopper.Instances.EtoDocumentEditor) == Eto.Forms.DialogResult.Ok)
            {
                System.IO.File.WriteAllText(dlg.FileName, HTTPRecord.SolveRequest);
            }
        }

        void ExportLastSolveResponse()
        {
            if (String.IsNullOrEmpty(HTTPRecord.SolveResponse))
            {
                Eto.Forms.MessageBox.Show("No solve response has been received. Run this component at least once", Eto.Forms.MessageBoxType.Error);
                return;
            }
            var dlg = new Eto.Forms.SaveFileDialog();
            dlg.Filters.Add(new Eto.Forms.FileFilter("JSON file", ".json"));
            if (dlg.ShowDialog(Grasshopper.Instances.EtoDocumentEditor) == Eto.Forms.DialogResult.Ok)
            {
                System.IO.File.WriteAllText(dlg.FileName, HTTPRecord.SolveResponse);
            }
        }

        string _tempPath;
        void RebuildWithNewPathAndRecompute(string path)
        {
            if (string.Equals(path, RemoteDefinitionLocation))
                return;
            _tempPath = path;
            Rhino.RhinoApp.Idle += RebuildAfterSolution;
        }

        private void RebuildAfterSolution(object sender, EventArgs e)
        {
            var doc = OnPingDocument();
            if (doc != null && doc.SolutionDepth == 0)
            {
                Rhino.RhinoApp.Idle -= RebuildAfterSolution;
                RemoteDefinitionLocation = _tempPath;
                _tempPath = null;
            }
        }

        // keep public in case external C# code wants to set this
        public string RemoteDefinitionLocation
        {
            get
            {
                if (_remoteDefinition != null)
                {
                    return _remoteDefinition.Path;
                }
                return string.Empty;
            }
            set
            {
                // Always rebuild the remote definition information when setting this property.
                // This way you can poke the path button to force a refresh in case the situation
                // on the server has changed.
                {
                    if(_remoteDefinition != null)
                    {
                        _remoteDefinition.Dispose();
                        _remoteDefinition = null;
                    }
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        _remoteDefinition = RemoteDefinition.Create(value, this);
                        HopsLog.Log.Debug($"Remote definition location set to {value}");
                        DefineInputsAndOutputs();
                    }
                }
            }
        }

        public override void CollectData()
        {
            base.CollectData();
            if (_showPathInput &&
                !string.IsNullOrWhiteSpace(RemoteDefinitionLocation) &&
                !Params.Input[0].VolatileData.IsEmpty)
            {
                var path = Params.Input[0].VolatileData.get_Path(0);
                string newPath = Params.Input[0].VolatileData.get_Branch(path)[0].ToString();
                if (!string.Equals(newPath, RemoteDefinitionLocation))
                    RebuildWithNewPathAndRecompute(newPath);
            }
        }

        public void HopsAddRuntimeMessage(GH_RuntimeMessageLevel level, string message)
        {
            if(HopsLog.Log is object)
            {
                switch (level)
                {
                    case GH_RuntimeMessageLevel.Remark:
                        HopsLog.Log.Information(message);
                        break;
                    case GH_RuntimeMessageLevel.Warning:
                        HopsLog.Log.Warning(message);
                        break;
                    case GH_RuntimeMessageLevel.Error:
                        HopsLog.Log.Error(message);
                        break;
                    default:
                        HopsLog.Log.Debug(message);
                        break;
                }
            }

            AddRuntimeMessage(level, message);
        }

        void DefineInputsAndOutputs()
        {
            if (_remoteDefinition != null)
            {
                ClearRuntimeMessages();
                string description = _remoteDefinition.GetDescription(out System.Drawing.Bitmap customIcon);

                if (_remoteDefinition.IsNotResponingUrl())
                {
                    HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, "Unable to connect to server");
                    Grasshopper.Instances.ActiveCanvas?.Invalidate();
                    return;
                }

                if (_remoteDefinition.IsInvalidUrl())
                {
                    HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, "Path appears valid, but to something that is not Hops related");
                    Grasshopper.Instances.ActiveCanvas?.Invalidate();
                    return;
                }
                if(HTTPRecord.IOResponseSchema != null && HTTPRecord.IOResponseSchema.Errors.Count > 0)
                {
                    foreach(var error in HTTPRecord.IOResponseSchema.Errors)
                    {
                        HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, error);
                        Grasshopper.Instances.ActiveCanvas?.Invalidate();
                        return;
                    }
                }
                if(HTTPRecord.IOResponseSchema != null && HTTPRecord.IOResponseSchema.Warnings.Count > 0)
                {
                    foreach (var warning in HTTPRecord.IOResponseSchema.Warnings)
                    {
                        HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Warning, warning);
                    }
                }

                if (!string.IsNullOrWhiteSpace(description) && !Description.Equals(description))
                {
                    Description = description;
                }
                var inputs = _remoteDefinition.GetInputParams();
                var outputs = _remoteDefinition.GetOutputParams();

                bool buildInputs = inputs != null;
                bool buildOutputs = outputs != null;

                // check to see if the existing params match
                Dictionary<string, List<IGH_Param>> inputSources = new Dictionary<string, List<IGH_Param>>();
                foreach (var param in Params.Input)
                {
                    inputSources.Add(param.Name, new List<IGH_Param>(param.Sources));
                }

                Dictionary<string, List<IGH_Param>> outputRecipients = new Dictionary<string, List<IGH_Param>>();
                foreach (var param in Params.Output)
                {
                    outputRecipients.Add(param.Name, new List<IGH_Param>(param.Recipients));
                }

                int inputCount = inputs!=null ? inputs.Count : 0;
                if (_showEnabledInput)
                    inputCount++;
                if (_showPathInput)
                    inputCount++;
     
                if(_iteration == 0)
                {
                    if (buildInputs && Params.Input.Count == inputCount)
                    {
                        foreach (var param in Params.Input.ToArray())
                        {
                            if (!inputs.ContainsKey(param.Name))
                            {
                                buildInputs = true;
                                break;
                            }
                            else
                            {
                                // if input param exists, make sure param access is correct
                                var (input, _) = inputs[param.Name];
                                param.Access = RemoteDefinition.AccessFromInput(input);
                            }
                        }
                    }
                    if (buildOutputs && Params.Output.Count == outputs.Count)
                    {
                        buildOutputs = false;
                        foreach (var param in Params.Output.ToArray())
                        {
                            if (!outputs.ContainsKey(param.Name))
                            {
                                buildOutputs = true;
                                break;
                            }
                        }
                    }
                }
                
                // Remove all existing inputs and outputs
                if (buildInputs)
                {
                    foreach (var param in Params.Input.ToArray())
                    {
                        Params.UnregisterInputParameter(param);
                    }
                }
                if (buildOutputs)
                {
                    foreach (var param in Params.Output.ToArray())
                    {
                        Params.UnregisterOutputParameter(param);
                    }
                }

                bool recompute = false;
                if (buildInputs && inputs != null)
                {
                    HopsLog.Log.Debug($"Hops component rebuilding input parameters...");

                    var mgr = CreateInputManager();

                    if (_showPathInput)
                    {
                        const string name = "_Path";
                        int paramIndex = mgr.AddTextParameter(name, "Path", "URL to remote process", GH_ParamAccess.item);
                        if (paramIndex >= 0 && inputSources.TryGetValue(name, out List<IGH_Param> rehookInputs))
                        {
                            foreach (var rehookInput in rehookInputs)
                                Params.Input[paramIndex].AddSource(rehookInput);
                        }
                    }

                    if (_showEnabledInput)
                    {
                        const string name = "_Enabled";
                        int paramIndex = mgr.AddBooleanParameter(name, "Enabled", "Enabled state for solving", GH_ParamAccess.item);
                        if (paramIndex >= 0 && inputSources.TryGetValue(name, out List<IGH_Param> rehookInputs))
                        {
                            foreach (var rehookInput in rehookInputs)
                                Params.Input[paramIndex].AddSource(rehookInput);
                        }
                    }

                    foreach (var kv in inputs)
                    {
                        string name = kv.Key;
                        var (input, param) = kv.Value;
                        GH_ParamAccess access = RemoteDefinition.AccessFromInput(input);
                        string inputDescription = name;
                        if (!string.IsNullOrWhiteSpace(input.Description))
                            inputDescription = input.Description;

                        if (input.Minimum != null)
                        {
                            double min = Convert.ToDouble(input.Minimum);
                            int digits = min.ToString(System.Globalization.CultureInfo.InvariantCulture).SkipWhile(c => c != '.').Skip(1).Count();
                            string formatter = digits < 1 ? "N1" : "N" + digits.ToString();
                            inputDescription += $"\nMinimum: {min.ToString(formatter, System.Globalization.CultureInfo.InvariantCulture)}";
                        }

                        if (input.Maximum != null)
                        {
                            double max = Convert.ToDouble(input.Maximum);
                            int digits = max.ToString(System.Globalization.CultureInfo.InvariantCulture).SkipWhile(c => c != '.').Skip(1).Count();
                            string formatter = digits < 1 ? "N1" : "N" + digits.ToString();
                            inputDescription += $"\nMaximum: {max.ToString(formatter, System.Globalization.CultureInfo.InvariantCulture)}";
                        }

                        string nickname = name;
                        if (!string.IsNullOrWhiteSpace(input.Nickname))
                            nickname = input.Nickname;
                        int paramIndex = -1;
                        var tree = new Resthopper.IO.DataTree<ResthopperObject>();
                        switch (param)
                        {
                            case Grasshopper.Kernel.Parameters.Param_Arc _:
                                paramIndex = mgr.AddArcParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Arc).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Arc).PersistentData.Append(new GH_Arc(JsonConvert.DeserializeObject<Arc>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Arc>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Arc).PersistentData.Append(new GH_Arc(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }                                     
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Boolean _:
                                paramIndex = mgr.AddBooleanParameter(name, nickname, inputDescription, access);
                                if(input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Boolean).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Boolean).PersistentData.Append(new GH_Boolean(Convert.ToBoolean(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            if (bool.TryParse(input.Default.ToString(), out bool result))
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Boolean).PersistentData.Append(new GH_Boolean(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Box _:
                                paramIndex = mgr.AddBoxParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Box).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Box).PersistentData.Append(new GH_Box(JsonConvert.DeserializeObject<Box>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Box>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Box).PersistentData.Append(new GH_Box(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Brep _:
                                paramIndex = mgr.AddBrepParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Brep).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Brep).PersistentData.Append(new GH_Brep(JsonConvert.DeserializeObject<Brep>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Brep>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Brep).PersistentData.Append(new GH_Brep(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Circle _:
                                paramIndex = mgr.AddCircleParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Circle).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Circle).PersistentData.Append(new GH_Circle(JsonConvert.DeserializeObject<Circle>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Circle>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Circle).PersistentData.Append(new GH_Circle(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    } 
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Colour _:
                                paramIndex = mgr.AddColourParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Colour).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Colour).PersistentData.Append(new GH_Colour(JsonConvert.DeserializeObject<Color>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Complex _:
                                paramIndex = mgr.AddComplexNumberParameter(name, nickname, inputDescription, access);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Culture _:
                                paramIndex = mgr.AddCultureParameter(name, nickname, inputDescription, access);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Curve _:
                                paramIndex = mgr.AddCurveParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Curve).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Curve).PersistentData.Append(new GH_Curve(JsonConvert.DeserializeObject<Curve>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Curve>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Curve).PersistentData.Append(new GH_Curve(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    } 
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Field _:
                                paramIndex = mgr.AddFieldParameter(name, nickname, inputDescription, access);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_FilePath _:
                                paramIndex = mgr.AddTextParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_String).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_String).PersistentData.Append(new GH_String(item.Data.ToString()), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_String).PersistentData.Append(new GH_String(input.Default.ToString()));
                                    }  
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_GenericObject _:
                                throw new Exception("Generic param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Geometry _:
                                paramIndex = mgr.AddGeometryParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Geometry).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    var json = JsonConvert.DeserializeObject(item.Data.ToString(), typeof(RhinoApp).Assembly.GetType(item.Type));
                                                    var geometry = GH_Convert.ToGeometricGoo(json);
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Geometry).PersistentData.Append(geometry, path);
                                                }
                                            }
                                        }
                                    } 
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Group _:
                                throw new Exception("Group param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Guid _:
                                throw new Exception("Guid param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Integer _:
                                paramIndex = mgr.AddIntegerParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Integer).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Integer).PersistentData.Append(new GH_Integer(Convert.ToInt32(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            if (int.TryParse(input.Default.ToString(), out int result))
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Integer).PersistentData.Append(new GH_Integer(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Interval _:
                                paramIndex = mgr.AddIntervalParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Interval).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Interval).PersistentData.Append(new GH_Interval(JsonConvert.DeserializeObject<Interval>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Interval>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Interval).PersistentData.Append(new GH_Interval(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Interval2D _:
                                paramIndex = mgr.AddInterval2DParameter(name, nickname, inputDescription, access);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_LatLonLocation _:
                                throw new Exception("Lat Lon Location param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Line _:
                                paramIndex = mgr.AddLineParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Line).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Line).PersistentData.Append(new GH_Line(JsonConvert.DeserializeObject<Line>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Line>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Line).PersistentData.Append(new GH_Line(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Matrix _:
                                paramIndex = mgr.AddMatrixParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Matrix).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Matrix).PersistentData.Append(new GH_Matrix(JsonConvert.DeserializeObject<Matrix>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Mesh _:
                                paramIndex = mgr.AddMeshParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Mesh).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Mesh).PersistentData.Append(new GH_Mesh(JsonConvert.DeserializeObject<Mesh>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Mesh>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Mesh).PersistentData.Append(new GH_Mesh(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    } 
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_MeshFace _:
                                paramIndex = mgr.AddMeshFaceParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_MeshFace).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_MeshFace).PersistentData.Append(new GH_MeshFace(JsonConvert.DeserializeObject<MeshFace>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_MeshParameters _:
                                throw new Exception("Mesh parameters param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Number _:
                                paramIndex = mgr.AddNumberParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Number).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Number).PersistentData.Append(new GH_Number(Convert.ToDouble(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            if (Double.TryParse(input.Default.ToString(), out double result))
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Number).PersistentData.Append(new GH_Number(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }  
                                break;
                            //case Grasshopper.Kernel.Parameters.Param_OGLShader:
                            case Grasshopper.Kernel.Parameters.Param_Plane _:
                                paramIndex = mgr.AddPlaneParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Plane).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Plane).PersistentData.Append(new GH_Plane(JsonConvert.DeserializeObject<Plane>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Plane>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Plane).PersistentData.Append(new GH_Plane(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }   
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Point _:
                                paramIndex = mgr.AddPointParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Point).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Point).PersistentData.Append(new GH_Point(JsonConvert.DeserializeObject<Point3d>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Point3d>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Point).PersistentData.Append(new GH_Point(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }    
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Rectangle _:
                                paramIndex = mgr.AddRectangleParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Rectangle).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Rectangle).PersistentData.Append(new GH_Rectangle(JsonConvert.DeserializeObject<Rectangle3d>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Rectangle3d>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Rectangle).PersistentData.Append(new GH_Rectangle(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    } 
                                }
                                break;
                            //case Grasshopper.Kernel.Parameters.Param_ScriptVariable _:
                            case Grasshopper.Kernel.Parameters.Param_String _:
                                paramIndex = mgr.AddTextParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_String).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_String).PersistentData.Append(new GH_String(item.Data.ToString()), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_String).PersistentData.Append(new GH_String(input.Default.ToString()));
                                    }     
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_StructurePath _:
                                paramIndex = mgr.AddPathParameter(name, nickname, inputDescription, access);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_SubD _:
                                paramIndex = mgr.AddSubDParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_SubD).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_SubD).PersistentData.Append(new GH_SubD(JsonConvert.DeserializeObject<SubD>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<SubD>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_SubD).PersistentData.Append(new GH_SubD(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Surface _:
                                paramIndex = mgr.AddSurfaceParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Surface).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Surface).PersistentData.Append(new GH_Surface(JsonConvert.DeserializeObject<Surface>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Surface>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Surface).PersistentData.Append(new GH_Surface(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Time _:
                                paramIndex = mgr.AddTimeParameter(name, nickname, inputDescription, access);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Transform _:
                                paramIndex = mgr.AddTransformParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Transform).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Transform).PersistentData.Append(new GH_Transform(JsonConvert.DeserializeObject<Transform>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Vector _:
                                paramIndex = mgr.AddVectorParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Vector).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Vector).PersistentData.Append(new GH_Vector(JsonConvert.DeserializeObject<Vector3d>(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            var result = JsonConvert.DeserializeObject<Vector3d>(input.Default.ToString());
                                            if (result.IsValid)
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Vector).PersistentData.Append(new GH_Vector(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }
                                }
                                break;
                            case Grasshopper.Kernel.Special.GH_NumberSlider _:
                                paramIndex = mgr.AddNumberParameter(name, nickname, inputDescription, access);
                                if (input.Default is object)
                                {
                                    if (input.Default.ToString().Contains("InnerTree"))
                                    {
                                        tree = JsonConvert.DeserializeObject<Resthopper.IO.DataTree<ResthopperObject>>(input.Default.ToString());
                                        if (tree.InnerTree is object)
                                        {
                                            (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Number).PersistentData.Clear();
                                            foreach (var branch in tree.InnerTree)
                                            {
                                                var pathElements = branch.Key.ToString().Trim('{', '}').Split(';');
                                                GH_Path path = new GH_Path(Array.ConvertAll(pathElements, int.Parse));
                                                List<ResthopperObject> items = branch.Value;
                                                foreach (var item in items)
                                                {
                                                    (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Number).PersistentData.Append(new GH_Number(Convert.ToDouble(item.Data.ToString())), path);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            if (Double.TryParse(input.Default.ToString(), out double result))
                                            {
                                                (mgr[paramIndex] as Grasshopper.Kernel.Parameters.Param_Number).PersistentData.Append(new GH_Number(result));
                                            }
                                        }
                                        catch (Exception e)
                                        {
                                            HopsAddRuntimeMessage(GH_RuntimeMessageLevel.Error, e.Message);
                                        }
                                    }   
                                }
                                break;
                        }

                        //make this parameter optional if user specified AtLeast value of zero
                        if (input.AtLeast == 0)
                            Params.Input[paramIndex].Optional = true;

                        if (paramIndex >= 0 && inputSources.TryGetValue(name, out List<IGH_Param> rehookInputs))
                        {
                            foreach (var rehookInput in rehookInputs)
                                Params.Input[paramIndex].AddSource(rehookInput);
                        }
                    }

                    recompute = true;
                }
                if (buildOutputs && outputs != null)
                {
                    HopsLog.Log.Debug($"Hops component rebuilding output parameters...");

                    var mgr = CreateOutputManager();
                    foreach (var kv in outputs)
                    {
                        string name = kv.Key;
                        var param = kv.Value;
                        string nickname = name;
                        if (!string.IsNullOrWhiteSpace(param.NickName))
                            nickname = param.NickName;
                        string outputDescription = name;
                        if (!string.IsNullOrWhiteSpace(param.Description))
                            outputDescription = param.Description;
                        int paramIndex = -1;
                        switch (param)
                        {
                            case Grasshopper.Kernel.Parameters.Param_Arc _:
                                paramIndex = mgr.AddArcParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Boolean _:
                                paramIndex = mgr.AddBooleanParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Box _:
                                paramIndex = mgr.AddBoxParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Brep _:
                                paramIndex = mgr.AddBrepParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Circle _:
                                paramIndex = mgr.AddCircleParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Colour _:
                                paramIndex = mgr.AddColourParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Complex _:
                                paramIndex = mgr.AddComplexNumberParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Culture _:
                                paramIndex = mgr.AddCultureParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Curve _:
                                paramIndex = mgr.AddCurveParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Field _:
                                paramIndex = mgr.AddFieldParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_FilePath _:
                                paramIndex = mgr.AddTextParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_GenericObject _:
                                paramIndex = mgr.AddGenericParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Geometry _:
                                paramIndex = mgr.AddGeometryParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Group _:
                                throw new Exception("group param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Guid _:
                                throw new Exception("guid param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Integer _:
                                paramIndex = mgr.AddIntegerParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Interval _:
                                paramIndex = mgr.AddIntervalParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Interval2D _:
                                paramIndex = mgr.AddInterval2DParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_LatLonLocation _:
                                throw new Exception("latlonlocation param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Line _:
                                paramIndex = mgr.AddLineParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Matrix _:
                                paramIndex = mgr.AddMatrixParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Mesh _:
                                paramIndex = mgr.AddMeshParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_MeshFace _:
                                paramIndex = mgr.AddMeshFaceParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_MeshParameters _:
                                throw new Exception("meshparameters param not supported");
                            case Grasshopper.Kernel.Parameters.Param_Number _:
                                paramIndex = mgr.AddNumberParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            //case Grasshopper.Kernel.Parameters.Param_OGLShader:
                            case Grasshopper.Kernel.Parameters.Param_Plane _:
                                paramIndex = mgr.AddPlaneParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Point _:
                                paramIndex = mgr.AddPointParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Rectangle _:
                                paramIndex = mgr.AddRectangleParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            //case Grasshopper.Kernel.Parameters.Param_ScriptVariable _:
                            case Grasshopper.Kernel.Parameters.Param_String _:
                                paramIndex = mgr.AddTextParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_StructurePath _:
                                paramIndex = mgr.AddPathParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_SubD _:
                                paramIndex = mgr.AddSubDParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Surface _:
                                paramIndex = mgr.AddSurfaceParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Time _:
                                paramIndex = mgr.AddTimeParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Transform _:
                                paramIndex = mgr.AddTransformParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                            case Grasshopper.Kernel.Parameters.Param_Vector _:
                                paramIndex = mgr.AddVectorParameter(name, nickname, outputDescription, GH_ParamAccess.tree);
                                break;
                        }

                        if (paramIndex >= 0 && outputRecipients.TryGetValue(name, out List<IGH_Param> rehookOutputs))
                        {
                            foreach (var rehookOutput in rehookOutputs)
                                rehookOutput.AddSource(Params.Output[paramIndex]); 
                        }
                    }
                }

                if (customIcon != null)
                {
                    // Draw hops icon overlay on custom icon. We can add an option
                    // to the data returned from a server to skip this overlay in
                    // the future.
                    // Create a slightly large image so we can cram the hops overlay
                    // deeper into the lower right corner
                    //var bmp = new System.Drawing.Bitmap(28, 28);
                    //using(var graphics = System.Drawing.Graphics.FromImage(bmp))
                    //{
                    //    // use fill to debug
                    //    //graphics.FillRectangle(System.Drawing.Brushes.PowderBlue, 0, 0, 28, 28);
                    //    var rect = new System.Drawing.Rectangle(2, 2, 24, 24);
                    //    graphics.DrawImage(customIcon, rect);
                    //    rect = new System.Drawing.Rectangle(16, 14, 14, 14);
                    //    graphics.DrawImage(Hops24Icon(), rect);

                    //}
                    SetIconOverride(customIcon);
                }
                if (buildInputs || buildOutputs)
                {
                    Params.OnParametersChanged();
                    Grasshopper.Instances.ActiveCanvas?.Invalidate();

                    if (recompute)
                    {
                        var doc = OnPingDocument();
                        if (doc != null)
                            doc.NewSolution(true);
                    }
                }
            }
            else
            {
                foreach (var param in Params.Input.ToArray())
                {
                    Params.UnregisterInputParameter(param);
                }

                var mgr = CreateInputManager();
                if (_showPathInput)
                    mgr.AddTextParameter("_Path", "Path", "URL to remote process", GH_ParamAccess.item);
                if (_showEnabledInput)
                    mgr.AddBooleanParameter("_Enabled", "Enabled", "Enabled state for solving", GH_ParamAccess.item, true);
                Params.OnParametersChanged();
                Grasshopper.Instances.ActiveCanvas?.Invalidate();
            }
        }

        GH_InputParamManager CreateInputManager()
        {
            var constructors = typeof(GH_InputParamManager).GetConstructors(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            var mgr = constructors[0].Invoke(new object[] { this }) as GH_InputParamManager;
            return mgr;
        }
        GH_OutputParamManager CreateOutputManager()
        {
            var constructors = typeof(GH_OutputParamManager).GetConstructors(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            var mgr = constructors[0].Invoke(new object[] { this }) as GH_OutputParamManager;
            return mgr;
        }

        public void OnRemoteDefinitionChanged()
        {
            if (_remoteDefinitionRequiresRebuild)
                return;

            // this is typically called on a different thread than the main UI thread
            _remoteDefinitionRequiresRebuild = true;
            Rhino.RhinoApp.Idle += RhinoApp_Idle;
        }

        private void RhinoApp_Idle(object sender, EventArgs e)
        {
            if (!_remoteDefinitionRequiresRebuild)
            {
                // not sure how this could happen, but in case it does just
                // remove the idle event and bail
                Rhino.RhinoApp.Idle -= RhinoApp_Idle;
                return;
            }

            var ghdoc = OnPingDocument();
            if (ghdoc != null && ghdoc.SolutionState == GH_ProcessStep.Process)
            {
                // Processing a solution. Wait until the next idle event to do something
                return;
            }

            // stop the idle event watcher
            Rhino.RhinoApp.Idle -= RhinoApp_Idle;
            _remoteDefinitionRequiresRebuild = false;
            DefineInputsAndOutputs();
        }
    }
}
