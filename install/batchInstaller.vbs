batchInstall

Sub batchInstall
   
  Dim nodeList, demo, i
  
  Set XHELPER         = new xmlHelper
  Set FILEMANAGER     = new fileSystemControl
  Set SQLPLUS         = new sqlPlusControl
  Set SQLLDR		      = new sqlldrControl
  Set FTP             = new ftpControl
  
  set MINSTALLER      = new batchInstaller
  set LINUX           = Nothing

  dim oracleHome, oracleSID
  
  dim demoName

  MINSTALLER.findOracleHome
  oracleHome = MINSTALLER.getGlobalParameter("oracleHome")
  
  If ISNULL(oracleHome) or (oracleHome = "") then
  	oracleHome = MINSTALLER.oracleHome
  	If ISNULL(oracleHome) or (oracleHome = "") Then
  	  wscript.echo "Fatal Error : Unable to Determine Oracle Home. Please specifiy 'oracleHome' attribute to batchInstall.xml"
  	  wscript.quit
  	End if
 	End if
  
  oracleSID = MINSTALLER.getGlobalParameter("tnsalias")
  
  If isNULL(oracleSID) or (oracleSID = "") then
  	oracleSID = MINSTALLER.oracleSID
  	If  isNULL(oracleSID) or (oracleSID = "") Then
  	  wscript.echo "Fatal Error : Unable to Determine TNSALIAS. Please specifiy 'tnsalias' attribute to batchInstall.xml"
  	  wscript.quit
  	End if
 	End if

	wscript.echo "Using OracleHome '" & oracleHome & "' and SID '" & oracleSID & "'"

  Set nodeList = MINSTALLER.getElementByName("/InstallList/Demo")

  For i = 0 to nodeList.length - 1
     
    Set demo = nodeList.item(i)
    LOGBUFFER = ""    
    MINSTALLER.setCurrentDemo(demo)
    demoName = demo.getAttribute("name") 
    MINSTALLER.setDemo(demoName)
    wscript.echo "Processing '" & demoName & "' using configuration  : " & MINSTALLER.getConfigurationPath()
    MINSTALLER.setInstallFolder
 
    Set INSTALLER       = new installationManager
    INSTALLER.setInstallationParameters _
                oracleHome, _
                oracleSID, _
                MINSTALLER.getGlobalParameter("host"),   _
                MINSTALLER.getGlobalParameter("http"),   _
                MINSTALLER.getGlobalParameter("ftp"),    _
                MINSTALLER.getGlobalParameter("driveLetter"),_
                MINSTALLER.getGlobalParameter("dba"),        _
                MINSTALLER.getGlobalParameter("dbaPassword"),_
                demo.getAttribute("user"),               _
                demo.getAttribute("password")
                     
    Set REPOS           = new repositoryControl
    Set DEMONSTRATION   = new demonstrationConfiguration
 
    If (INSTALLER.requiresSYSDBA()) then
      If (Not validSYSDBA(INSTALLER,SQLPLUS)) Then
    	  wscript.echo "Fatal Error : SYSDBA Credentials required and not correct"
    	  wscript.quit
      End If
    End If
 
    If (Not validDBA(INSTALLER,SQLPLUS)) Then
    	wscript.echo "Fatal Error : DBA Credentials not correct"
    	wscript.quit
    End If
 
    If (Not validUsername(INSTALLER,SQLPLUS)) Then
    	wscript.echo "Fatal Error : User Credentials not correct"
    	wscript.quit
    End If
 
    If (Not validHTTPConnection(INSTALLER,REPOS)) Then
    	wscript.echo "Fatal Error : HTTP Connectivity not available"
    	wscript.quit
    End If
 
    If (Not validDriveLetter(INSTALLER)) Then
      wscript.echo "Fatal Error : WebDAV Connectivity not available"
      wscript.quit
    End If
 
    If Not(IsNull(INSTALLER.getDriveLetter())) Then 
      result = mapNetworkDrive(INSTALLER,FILEMANAGER)
      If (Not result) Then
      	 wscript.echo "Fatal Error : WebDAV Connectivity not available"
      	 wscript.quit
      End If
    End If
 
 	  doBatchInstall
 	  
    writeLogFile LOGBUFFER
    wscript.echo "Complete " & demo.getAttribute("name") & ". See log file '" & INSTALLER.getLogFilePath() & "' for full details."

    MINSTALLER.setScriptFolder

  Next

End Sub

Sub doBatchInstall

  dim nodeList, action, i
  set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/installation/action")

  For i = 0 to nodeList.length - 1
    doAction nodeList(i),i+1
  Next

End Sub

CLASS BATCHINSTALLER

  Dim batchInstallList
  Dim currentDemo

  Dim oracleHome 
  Dim oracleSID 

  Dim FSO
  Dim WSHELL
  
  Private demoName
  
  Private Sub Class_Initialize()

    dim filename, result

    filename = "batchInstallParameters.xml"
    Set batchInstallList = CreateObject("Msxml2.FreeThreadedDOMDocument.6.0")
    batchInstallList.async = false
    result = batchInstallList.load(filename)

    Set FSO = CreateObject("Scripting.FileSystemObject")
    Set WSHELL          = CreateObject("WScript.Shell")

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
    WSHELL.CurrentDirectory = FSO.GetParentFolderName(WSHELL.CurrentDirectory) & "\" & demoName & "\install"
    wscript.echo "Working Directory set to '" & WSHELL.CurrentDirectory & "'"
  End Sub

  Public sub setScriptFolder() 
    WSHELL.CurrentDirectory = FSO.getParentFolderName(FSO.GetParentFolderName(WSHELL.CurrentDirectory)) & "\scripts"
    wscript.echo "Working Directory set to '" & WSHELL.CurrentDirectory &"'"
  End Sub

  Public Function getGlobalParameter(name)
    getGlobalParameter = batchInstallList.documentElement.getAttribute(name)
  End Function
  
  Public Function getConfigurationPath 
        
     getConfigurationPath = FSO.GetParentFolderName(WSHELL.CurrentDirectory) & "\" & demoName & "\install\" & demoName & ".xml"
     
  End Function

  Public Function getInstallerPath 
        
     getInstallerPath = FSO.GetParentFolderName(WSHELL.CurrentDirectory) & "\install\install.hta"
     
  End Function

  Private Function EnumSubKeys (RootKey, Key, RegType) 

    Dim oCtx, oLocator, oReg, oInParams, oOutParams
 
    Set oCtx = CreateObject("WbemScripting.SWbemNamedValueSet") 
    oCtx.Add "__ProviderArchitecture", RegType 
 
    Set oLocator = CreateObject("Wbemscripting.SWbemLocator") 
    Set oReg = oLocator.ConnectServer("", "root\default", "", "", , , , oCtx).Get("StdRegProv") 

    Set oInParams = oReg.Methods_("EnumKey").InParameters 
    oInParams.hDefKey = RootKey 
    oInParams.sSubKeyName = Key 

   	Set oOutparams = oReg.ExecMethod_("EnumKey", oInparams,,oCtx) 
    EnumSubKeys = oOutparams.snames
   
  End Function

  Function ReadRegStr (RootKey, Key, Value, RegType) 

    Dim oCtx, oLocator, oReg, oInParams, oOutParams 
 
    Set oCtx = CreateObject("WbemScripting.SWbemNamedValueSet") 
    oCtx.Add "__ProviderArchitecture", RegType 
 
    Set oLocator = CreateObject("Wbemscripting.SWbemLocator") 
    Set oReg = oLocator.ConnectServer("", "root\default", "", "", , , , oCtx).Get("StdRegProv") 
 
    Set oInParams = oReg.Methods_("GetStringValue").InParameters 
    oInParams.hDefKey = RootKey 
    oInParams.sSubKeyName = Key 
    oInParams.sValueName = Value 
 
    Set oOutParams = oReg.ExecMethod_("GetStringValue", oInParams, , oCtx) 
 
    ReadRegStr = oOutParams.sValue 

  End Function
  
  
  Function validOracleHome(oh,os)
  
    dim path1, path2 
    
    path1 = oh & "\bin\sqlplus.exe"
    path2 = oh & "\sqlplus.exe"
    
    If (FSO.fileExists(path1) or FSO.fileExists(path2)) Then
			oracleHome = oh
      oracleSID  = os      
      validOracleHome = True
    Else
      validOracleHome = False
    End If

  End Function
    
  Sub findOracleHome()
  
  	' Find the First OracleHome and SID.

    Const oraclePath = "SOFTWARE\ORACLE"   
    Const HKLM = &h80000002

    DIM keyValue, sName, sValue, cSubKeys 
    DIM oracleHome, oracleHomeName, oracleHomeKey, oracleSID
                
    cSubKeys = EnumSubKeys(HKLM,oraclePath,64)
    If not isNull(cSubKeys) Then 
   	  For Each sName In cSubKeys
        sValue = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME", 64)
        If (not IsNull( sValue )) Then
          oracleHome = sValue
          oracleSID = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_SID", 64) 
          If (validOracleHome(oracleHome, oracleSID)) Then
          	Exit Sub
          End if
        End If
  	  Next 
    End If    

    cSubKeys = EnumSubKeys(HKLM,oraclePath,32)
    If not isNull(cSubKeys) Then 
     	For Each sName In cSubKeys
        sValue = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME", 32) 
        If (not IsNull( sValue )) Then
          oracleHome = sValue
          oracleSID = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_SID", 64) 
          If (validOracleHome(oracleHome, oracleSID)) Then
          	Exit Sub
          End If
        End If
  	  Next 
    End If
    
  End Sub
  
End Class
