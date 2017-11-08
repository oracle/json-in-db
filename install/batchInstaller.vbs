Option Explicit

batchInstall

Sub batchInstall
   
   
  Dim CONTROLLER
  Dim nodeList, demo, i
  
  Set ENVIRONMENT     = new environmentHelper
  Set Application     = new DosInstaller

  set CONTROLLER      = new batchController
  
  ENVIRONMENT.findOracleHome

  oracleHome = CONTROLLER.getGlobalParameter("oracleHome")
  
  If ISNULL(oracleHome) or (oracleHome = "") then
  	oracleHome = ENVIRONMENT.getOracleHome()
  	If ISNULL(oracleHome) or (oracleHome = "") Then
  	  Application.exitFatalError "Unable to Determine Oracle Home. Please specifiy 'oracleHome' attribute to batchInstall.xml" 
  	End if
  End if
  
  oracleSID = CONTROLLER.getGlobalParameter("tnsalias")
  
  If isNULL(oracleSID) or (oracleSID = "") then
  	oracleSID = ENVIRONMENT.getOracleSID()
  	If  isNULL(oracleSID) or (oracleSID = "") Then
  	  Application.exitFatalError  "Unable to Determine TNSALIAS. Please specifiy 'tnsalias' attribute to batchInstall.xml"
  	End if
  End if

  If (Not ENVIRONMENT.validOracleHome(oracleHome,oracleSID)) Then
	  Application.exitFatalError  "Invalid Oracle Home"
  End If

  APPLICATION.writeLogMessage("Using OracleHome '" & oracleHome & "' and SID '" & oracleSID & "'")

  Set XHELPER         = new xmlHelper
  
  Set IOMANAGER       = new fileSystemControl
  Set SQLPLUS         = new sqlPlusControl
  Set SQLLDR		  = new sqlldrControl
  Set FTP             = new ftpControl
  
  dim oracleHome, oracleSID
  
  dim demoName, message, result

  Set nodeList = CONTROLLER.getElementByName("/InstallList/Demo")

  For i = 0 to nodeList.length - 1
     
    Set demo = nodeList.item(i)
    LOGBUFFER = ""    
    CONTROLLER.setCurrentDemo(demo)
    demoName = demo.getAttribute("name") 
    CONTROLLER.setDemo(demoName)
    CONTROLLER.setInstallFolder
    message = "Processing '" & demoName & "' using configuration  : " & CONTROLLER.getConfigurationPath()
    Application.writeLogMessage(message)
    
    Set CONFIGURATION = new configurationManager
        
    CONFIGURATION.setInstallationParameters _
                oracleHome, _
                oracleSID, _
                CONTROLLER.getGlobalParameter("host"),   _
                CONTROLLER.getGlobalParameter("http"),   _
                CONTROLLER.getGlobalParameter("ftp"),    _
                CONTROLLER.getGlobalParameter("driveLetter"),_
                CONTROLLER.getGlobalParameter("dba"),        _
                CONTROLLER.getGlobalParameter("dbaPassword"),_
                demo.getAttribute("user"),               _
                demo.getAttribute("password")
                     
    Set REPOS           = new repositoryControl
    Set DEMONSTRATION   = new demonstrationConfiguration
 
    If (CONFIGURATION.requiresSYSDBA()) then
      If (Not validSYSDBA(CONFIGURATION,SQLPLUS)) Then
    	  Application.exitFatalError  "SYSDBA Credentials required and not correct"
      End If
    End If
 
    If (Not validDBA(CONFIGURATION,SQLPLUS)) Then
    	Application.exitFatalError "DBA Credentials not correct"
    End If
 
    If (Not validUsername(CONFIGURATION,SQLPLUS)) Then
    	Application.exitFatalError "User Credentials not correct"
    End If
 
    If (Not validHTTPConnection(CONFIGURATION,REPOS)) Then
    	Application.exitFatalError  "HTTP Connectivity not available"
    End If
 
    If (Not validDriveLetter(CONFIGURATION)) Then
      Application.exitFatalError  "WebDAV Connectivity not available"
    End If
 
    If Not(IsNull(CONFIGURATION.getDriveLetter())) Then 
      result = mapNetworkDrive(CONFIGURATION,IOMANAGER)
      If (Not result) Then
      	 Application.exitFatalError "WebDAV Connectivity not available"
      End If
    End If
 
 	  doBatchInstall

    message = "Complete " & demo.getAttribute("name") & ". See log file '" & APPLICATION.getLogFilePath() & "' for full details."
    APPLICATION.writeLogMessage message
    APPLICATION.writeLog

    CONTROLLER.setScriptFolder

  Next

End Sub

Sub doBatchInstall

  dim nodeList, action, i
  set nodeList = CONFIGURATION.getDemonstrationParameter("/installerConfiguration/installation/action")

  For i = 0 to nodeList.length - 1
    doAction nodeList(i),i+1
  Next

End Sub

CLASS BatchController

  Dim NamedArgs
  Dim batchInstallList
  Dim currentDemo

  Dim oracleHome 
  Dim oracleSID 
  
  Private demoName
  
  Private Sub Class_Initialize()

    set NamedArgs = WSCRIPT.arguments.named

    dim filename, result

    filename = "batchInstallParameters.xml"
    Set batchInstallList = CreateObject("Msxml2.FreeThreadedDOMDocument.6.0")
    batchInstallList.async = false
    result = batchInstallList.load(filename)


  End Sub
  
  Public Sub setDemo(name)
    
    demoName = name
    
  End Sub
  
  Public Function getElementByName(xpath)
  
    Set getElementByName = batchInstallList.documentElement.selectNodes(xpath)
  
  End Function
  
  Public sub setCurrentDemo(demo) 
    set currentDemo = demo
  End Sub
  
  Public sub setInstallFolder() 
    ENVIRONMENT.getWShell().CurrentDirectory = ENVIRONMENT.getFSO().GetParentFolderName(ENVIRONMENT.getWShell().CurrentDirectory) & "\" & demoName & "\install"
    Application.writeLogMessage "Working Directory set to '" & ENVIRONMENT.getWShell().CurrentDirectory & "'"
  End Sub

  Public sub setScriptFolder() 
    ENVIRONMENT.getWShell().CurrentDirectory = ENVIRONMENT.getFSO().getParentFolderName(ENVIRONMENT.getFSO().GetParentFolderName(ENVIRONMENT.getWShell().CurrentDirectory)) & "\install"
    Application.writeLogMessage "Working Directory set to '" & ENVIRONMENT.getWShell().CurrentDirectory &"'"
  End Sub

  Public Function getGlobalParameter(name)
    ' getGlobalParameter = batchInstallList.documentElement.getAttribute(name)
	Wscript.echo "Parameter " + name + ":" + NamedArgs.item(name)
	getGlobalParameter = NamedArgs.item(name)
  End Function
  
  Public Function getConfigurationPath 
        
     getConfigurationPath = ENVIRONMENT.getWShell().CurrentDirectory & FILE_SEPERATOR & demoName & ".xml"
     
  End Function
    
End Class

Class DosInstaller

  DIM appHelper
  DIM logFilePath

  Public Sub class_initialize
	
	Dim scriptName
		
	scriptName = WSCRIPT.scriptName
	
	Set AppHelper = new WscriptAppHelper
    logFilePath = ENVIRONMENT.getWshell().CurrentDirectory & FILE_SEPERATOR & mid(scriptName,1,len(scriptName)-4) & ".log"	
	  
  End Sub

  Public Function GetInstallType
  
     getInstallType = DOS_INSTALL
     
  End Function

  Public Sub writeLogMessage(logMessage)
 
    appHelper.writeLogMessage logMessage
    WSCRIPT.echo logMessage
  
  End sub

  Public Function writeLog()
  
  	appHelper.writeLog logFilePath
  	writeLog = logFilePath
  
  End Function

  Public Sub ExitFatalError(errorMessage)
      
    appHelper.exitFatalError logFilePath, errorMessage
    
  End Sub

  Public Sub reportError(errorMessage) 
  
    appHelper.reportError logFilePath, errorMessage 

  End Sub
  
  Public Function getLogFilePath
  
    getLogFilePath = logFilePath
    
  End Function

End Class
