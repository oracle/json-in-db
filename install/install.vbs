
' /* ================================================  
' * Oracle XML/JSON Demonstration Installer.  
' *    
' * Copyright (c) 2014 Oracle and/or its affiliates.  All rights reserved.
' *
' * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
' *
' * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
' *
' * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
' *
' * ================================================ */

Option Explicit
Const FILE_SEPERATOR    = "\" 
Const CONFIG_LOAD_FAILED = 1

' Shortcut Logic.

'   shortCutFolderPath  : Path to folder where Shortcuts for each step of the demo will be placed
'                         Typically %DEMOFOLDER%\%USER%

'   launchPadFolderPath : Path to folder where LaunchPad for the demo will be placed. 
'                         Typically %STARTMENT%\Oracle XML DB Demonstrations

dim SCRIPT_GENERATOR
dim MINSTALLER

dim INSTALLER
dim FILEMANAGER 
                    
dim XHELPER
dim SQLPLUS
dim SQLLDR
dim FTP
dim REPOS

dim LOGBUFFER
dim DEMONSTRATION
dim CURRENTTIMER

dim ACTION_LIST
dim ACTION_INDEX

dim newFolderList 

Sub ShowError(msg)
    MsgBox msg & " : " & Err.Number & " Srce: " & Err.Source & " Desc: " &  Err.Description    
    Err.Clear
    Stop
End Sub

Function doTransformation(INSTALLATION,xslFilename)

  dim inputStylesheet, result, xslProcessor, errorMessage
  
  Set inputStylesheet = CreateObject("Msxml2.FreeThreadedDOMDocument.6.0")
  inputStylesheet.async = false
  inputStylesheet.resolveExternals = true
  result = inputStylesheet.load(xslFilename)

  If (result = False) Then 
    errorMessage = "Error while loading or parsing file : " & xslFilename
    exitFatalError(errorMessage)    
  End If
  
  dim xslt
  set xslt = CreateObject("Msxml2.XSLTemplate.6.0")
  set xslt.stylesheet = inputStylesheet 
  set xslProcessor = xslt.createProcessor()
  xslProcessor.input = INSTALLATION
  xslProcessor.transform()
  doTransformation = xslProcessor.output

End Function

Function writeLogFile(logFileContent)

  Dim logFilePath, logFile

  logFilePath = INSTALLER.getLogFilePath()
  Set logFile = INSTALLER.getFSO().createTextFile(logFilePath,true)
  logFile.write(logFileContent)
  logFile.close()
  
  writeLogFile = logFilePath 

End Function

Sub ExitHTA
 
   strComputer = "."
   Set objWMIService = GetObject("winmgmts:" & "{impersonationLevel=impersonate}!\\" & strComputer & "\root\cimv2")
   Set colProcessList = objWMIService.ExecQuery ("Select * from Win32_Process Where Name = 'mshta.exe'")
   For Each objProcess in colProcessList
     MsgBox "Killing Process"
     objProcess.Terminate()
   Next
 
 End Sub
 
 Function exitFatalError(errorMessage) 

  Dim logFilePath
  
  writeLogMessage errorMessage
  If (Err.number <> 0) Then
    LOGBUFFER = LOGBUFFER & "Encountered error 0x" & hex(Err.number)  & " : " & Err.Description 
  End If
  LOGBUFFER = LOGBUFFER & ". Please check installParameters.xml and "& INSTALLER.getDemoFolderName() & " and then restart the installation" & vbCRLF   
  
  logFilePath = writeLogFile(LOGBUFFER)

  If not INSTALLER.isInteractiveInstall() Then 
  	Wscript.echo "exitFatalError(): " & errorMessage & ". See " &  vbCRLF & "'"  & logFilePath  & "'" & vbCRLF & " for further details."
  	WScript.Quit
  Else  
    MsgBox "Fatal Error : " & errorMessage & ". See " &  vbCRLF & "'"  & logFilePath  & "'" & vbCRLF & " for further details.", vbOKOnly + vbCritical  
    window.close()
    ExitHTA
  End If
  
End Function  

Sub writeLogMessage(logMessage)
 
  DIM currentAction

  LOGBUFFER = LOGBUFFER + logMessage + vbCRLF 
  
  If not INSTALLER.isInteractiveInstall() Then 
  	wscript.echo logMessage
  Else
    Set currentAction = document.getElementById("currentTask")
    
    If not (currentAction is NOTHING) Then
      currentAction.value = logMessage
    Else
      MsgBox "Fatal Error : " & logMessage & ". Installer will terminate.", vbOKOnly + vbCritical  
      window.close()
      ExitHTA
    End If

  End If

End sub

Sub remapDrive()

  ' Entry Point for the Remap Drive Application

  LOGBUFFER = ""
  window.resizeTo 650,140
  
  Set XHELPER         = new xmlHelper
  Set INSTALLER       = new installationManager  
  Set FILEMANAGER     = new fileSystemControl
  
  showDriveMappingForm(INSTALLER.getInstallationParameters())
   
End Sub
       
Sub showDriveMappingForm(INSTALLATION)

  dim xslFilename, target
  
  If (INSTALLER.getWindowsVersion < 6.1) Then
  	MsgBox "Mapping XML DB repository to Drive Letter only supported on Windows 7 and higher",vbCritical
  	self.close()
  End If
  
  xslFilename = "remapDrive.xsl"

  Set target = Document.getElementById("inputForm")
  target.innerHTML = doTransformation(INSTALLATION,xslFilename) 

End Sub

Sub cancelRemapDrive

  self.close()

End Sub

Sub verifyDrive

  dim result, driveLetter, windowsShareName
  
  If INSTALLER.getPassword() = "" Then
  	MsgBox "Please Enter Password",vbCritical
    Exit Sub
  End If
  
  If (validDriveLetter(INSTALLER)) Then
    windowsShareName = UCase("\\" & INSTALLER.getHostName() & "@" & INSTALLER.getHttpPort() & "\DavWWWRoot")
    driveLetter = UCase(Left(INSTALLER.getDriveLetter(),1))
    MsgBox "Drive '" & driveLetter & "'. Mapped to '" & windowsShareName & "'. and is available.",vbInformation
  End If
  
End Sub

Sub mapDrive
  
  dim result, driveLetter, windowsShareNamecurrent,Operation

  windowsShareName = UCase("\\" & INSTALLER.getHostName() & "@" & INSTALLER.getHttpPort() & "\DavWWWRoot")
  driveLetter = UCase(Left(INSTALLER.getDriveLetter(),1))

  currentOperation = "  MAP DRIVE '" & driveLetter & "'. Target => '" & windowsShareName & "'."
  writeLogMessage currentOperation

  If INSTALLER.getPassword() = "" Then
  	MsgBox "Please Enter Password",vbCritical
    Exit Sub
  End If

  result = mapNetworkDrive(INSTALLER,FILEMANAGER)

  If (result) Then
    MsgBox "Drive '" & driveLetter & "'. Mapped to '" & windowsShareName & "'. and is available.",vbInformation
  Else
    MsgBox "Unable to map Drive '" & driveLetter & "' to '" & windowsShareName & "'",vbInformation
  End If
  
End Sub

Sub installDemo()

  ' Entry Point for the Demonstration Installation Application
  On Error Goto 0

  LOGBUFFER = ""
  window.resizeTo 580,375
  
  Set XHELPER          = new xmlHelper
  Set INSTALLER        = new installationManager  
  Set DEMONSTRATION    = new demonstrationConfiguration
  Set FILEMANAGER      = new fileSystemControl
  Set SQLPLUS          = new sqlPlusControl
  Set SQLLDR		       = new sqlldrControl
  Set FTP              = new ftpControl
  Set REPOS            = new repositoryControl
  Set MINSTALLER       = Nothing 
  Set SCRIPT_GENERATOR = Nothing
    
  showInputForm(INSTALLER.getInstallationParameters())
   
End Sub

Sub getPorts() 

  Dim httpPortNumber, ftpPortNumber

  INSTALLER.readInstallationDialog
  
  If (validOracleHome(INSTALLER)) Then
    If (validDBA(INSTALLER,SQLPLUS)) Then
    	httpPortNumber = SQLPLUS.getHttpPort(INSTALLER.getDBAUsername, INSTALLER.getDBAPassword)
  	  document.getElementById("httpPort").value = httpPortNumber
  	  ftpPortNumber  = SQLPLUS.getFtpPort(INSTALLER.getDBAUsername, INSTALLER.getDBAPassword)
  	  document.getElementById("ftpPort").value = ftpPortNumber
  	End If
  End If

End Sub

Sub cancelInstall()

  Dim logFilePath

  writeLogMessage "Installation Cancelled"
  logFilePath = writeLogFile(LOGBUFFER)
  self.close()

End Sub

Sub setOracleHome
  
  dim nodeList, elem, oh, os
  dim installParams, selector 
  
  set installParams = INSTALLER.getInstallationParameters()
  set selector = document.getElementById("oracleHomeSelector") 

  Set nodeList = installParams.documentElement.selectNodes("/installationParameters/OracleHomeList/OracleHome[name="""  & selector.value & """]")

	Set oh = document.getElementById("oracleHome")
	Set os = document.getElementById("tnsAlias")
  
  If (nodeList.length > 0) Then
  	  oh.value    = XHELPER.getTextNode(nodeList.item(0),"path")
     os.value    = XHELPER.getTextNode(nodeList.item(0),"sid")
     oh.readOnly = true
     os.readOnly = false
   Else
	  Set nodeList = installParams.documentElement.selectNodes("/installationParameters")
  	  oh.value     = XHELPER.getTextNode(nodeList.item(0),"oracleHome")
  	  os.value     = XHELPER.getTextNode(nodeList.item(0),"tnsAlias")
  	  oh.readOnly  = false
  	  os.readOnly  = false
 	End If

End Sub


Sub showInputForm(INSTALLATION)

  ' Use XSL to generate the Installation Parameters dialog from the Installation Parameters document.
  
  dim xslFilename, target, innerHTML, xml
   
  xslfilename = "install.xsl"
  Set target = Document.getElementById("inputForm")
  innerHTML = doTransformation(INSTALLATION,xslFilename)
  target.innerHTML = innerHTML
  
  ' Disable Drive letter on Windows XP and earlier 
  ' TODO : Check Vista
  ' TODO : Check Drive Letter in Windows XP
  
  If (INSTALLER.getWindowsVersion < 6.1) Then
  	Set target = document.getElementById("driveLetter")
  	If (Not target Is Nothing) Then
  		target.style.display = "none"
    End If
  End If
  
  ' If the Installation Parameters document did not specify values for Oracle Home and TNS Alias read
  ' values from the System Registry.
  
  setOracleHome

	Set target = document.getElementById("demonstrationName")
  target.value = INSTALLER.getDemonstrationName()
  
End Sub

Function validOracleHome(INSTALLER)

  Dim result
  result = INSTALLER.isOracleHomeValid
  
  If result Then
    validOracleHome = true
    Exit Function
  End If
        
  MsgBox "Unable to locate SQLPLUS executable. Please correct the setting of Oracle Home and try again.",vbOKOnly + vbCritical

  validOracleHome = false
  
End Function

Function validSYSDBA(INSTALLER,SQLPLUS)

  dim returnCode, connectionString

  connectionString = INSTALLER.getDBAUsername & "/********@" & INSTALLER.getTNSAlias() & " as sysdba"   
  
  returnCode = SQLPLUS.testConnection(INSTALLER.getDBAUsername, INSTALLER.getDBAPassword, " as sysdba")

  If returnCode = false Then
     MsgBox "Invalid SYSDBA Credentials for connection: " & connectionString & ". Check TNS Alias, DBA User and Password.",vbOKOnly + vbCritical
  End If
  
  validSYSDBA = returnCode
  
End Function

Function validDBA(INSTALLER,SQLPLUS)

  dim returnCode, connectionString

  connectionString = INSTALLER.getDBAUsername & "/********@" & INSTALLER.getTNSAlias()   
  
  returnCode = SQLPLUS.testConnection(INSTALLER.getDBAUsername, INSTALLER.getDBAPassword, "")

  If returnCode = false Then
     MsgBox "Invalid DBA Credentials for connection: " & connectionString & ". Check TNS Alias, DBA User and Password.",vbOKOnly + vbCritical
  End If

  validDBA = returnCode
  
End Function

Function validUsername(INSTALLER,SQLPLUS)

  dim returnCode, connectionString

  connectionString = INSTALLER.getUsername & "/********@" & INSTALLER.getTNSAlias()   
  
	returnCode = SQLPLUS.testConnection(INSTALLER.getUsername, INSTALLER.getPassword, "")

  If returnCode = false Then
    MsgBox "Failed to connect as " & connectionString & ". Check TNS Alias, DBA User and Password.",vbOKOnly + vbCritical
  End If

  validUsername = returnCode
  
End Function
  
Function validHTTPConnection(INSTALLER,REPOS)

  Dim returnCode

  returnCode = REPOS.doGET("/xdbconfig.xml", INSTALLER.getDBAUsername(), INSTALLER.getDBAPassword())

  If returnCode = 200 Then
    validHTTPConnection = true
    Exit Function
  End If

  MsgBox "Unable to access " & INSTALLER.getServerURL() & "/xdbconfig.xml as user " & INSTALLER.getDBAUserName() & " (HTTP Status = '" & returnCode & "', Error Code = '" &  Err.number &"'). Please Check hostname and HTTP port number",vbOKOnly + vbCritical
  validHTTPConnection = false
  
End Function

Function validDriveLetter(CONFIGUATION)

  ' Need to check 2 things
  ' If any drive is connected to the target server, then this drive must be used. 
  ' This rule is needed since we cannot have 2 drives mapped to the same server as different user Id's.
  
  ' Assuming no drives are mapped to the target server then we check that the selected is not mapped to a different server
  
  ' Finally we need to check that connection to the server is made as the target user.


  dim driveLetter, dc, d, fso, networkMgr, i, networkPath, windowsShareName, reuseDrive, target, targetDrive
  
  windowsShareName = UCase("\\" & INSTALLER.getHostName() & "@" & INSTALLER.getHttpPort() & "\DavWWWRoot")

  driveLetter = UCase(Left(INSTALLER.getDriveLetter(),1))
  If (Not isNull(driveLetter)) Then
    Set fso = INSTALLER.getFSO()
    Set dc = fso.Drives
      
    ' Check if there is already a Drive Letter assignmen for the requested HTTP Server. If there is use the existing mapping
      
    For Each d in dc
      If d.DriveType = 3 Then
      	If (Ucase(d.ShareName) = windowsShareName) Then
          If d.IsReady Then
          	If (MINSTALLER Is Nothing) Then
              reuseDrive = MsgBox("Server '" & d.ShareName & "'. already mapped to '" & d.driveLetter & "'. Use existing mapping ?",vbYesNo + vbInformation + vbDefaultButton1)
              If (reuseDrive = vbYes) Then
                set target = Document.getElementById("driveLetter")
                targetDrive = d.driveLetter & ":"
                target.value = Ucase(targetDrive) 
                INSTALLER.addMacro "%DRIVELETTER%", targetDrive
            	  validDriveLetter = true
              Else
            	  validDriveLetter = false
              End If 	
            Else            	
            	WScript.echo "Server '" & d.ShareName & "'. already mapped to '" & d.driveLetter & "'. Using existing Mapping."
            	targetDrive = d.driveLetter & ":"
              INSTALLER.addMacro "%DRIVELETTER%", targetDrive
           	  validDriveLetter = true
            End If
            Exit Function
          End if
        End if
      End if
    Next              
 
    For Each d in dc
      If UCase(d.DriveLetter) = driveLetter Then
 	     validDriveLetter = false
        If d.DriveType = 3 Then
          If d.IsReady Then
            MsgBox "Cannot use drive '" & d.driveLetter & "'. Drive is mapped to '" & d.ShareName & "'.",vbOKOnly + vbCritical
          Else
            MsgBox "Cannot use drive '" & d.driveLetter & "'. Drive is Not ready.",vbOKOnly + vbCritical
          End if
        Else
        	' Drive is mapped to something other than a network drive 
          MsgBox "Cannot use drive '" & d.driveLetter & "'. Drive is used by disc volume '" & d.VolumeName & "'.",vbOKOnly + vbCritical
        End if
        Exit Function
      End if
    Next
      
    Set networkMgr = CreateObject("WScript.Network")
    Set dc = networkMgr.EnumNetworkDrives
    For i = 0 to dc.Count - 1 Step 2
      If UCase(dc.Item(i)) =  UCase(driveLetter) Then
        networkPath  = dc.Item(i+1)
        MsgBox "Cannot use drive '" & driveLetter & "'. Drive mapped to '" & networkPath & "'.",vbOKOnly + vbCritical
        validDriveLetter = false
       Exit Function
      End If 	
    Next    
  End If

  validDriveLetter = true
	   	
End Function

Function mapNetworkDrive(INSTALLER,FILEMGR)

   FILEMGR.MapNetworkDrive INSTALLER.getDriveLetter(), INSTALLER.getHostName(), INSTALLER.getHttpPort(), INSTALLER.getUserName(), INSTALLER.getPassword()
   mapNetworkDrive = true
   
End Function

Sub installationSuccessful(INSTALLER)

  Dim messageText, currentAction, logFilePath

  messageText = INSTALLER.getDemonstrationName() & " Successfully Installed." 
  messageText = messageText & vbCRLF & "To Launch the demonstration please select the item"  & vbCRLF 
  messageText = messageText & vbCRLF & Chr(9) & Chr(34) & INSTALLER.getLaunchPadFolderName()  & Chr(34) & Chr(9) 
  messageText = messageText & vbCRLF & "from the Start Menu and then click on the icon" & vbCRLF  
  messageText = messageText & vbCRLF & Chr(9) & Chr(34) & INSTALLER.getLaunchPad() & Chr(34) & vbCRLF  

  MsgBox messageText,vbOKOnly + vbInformation

  LOGBUFFER = LOGBUFFER + messageText
  
End Sub
  
Function LPad(Text,Length)  
  LPad = Left(Text & Space(Length), Length)
End Function
   
Private Sub processFolder(controlFile, folder, owner, id, step, sourceFolderPath, targetFolderPath)

  Dim subFolders, subFolder, Files, file, relativePath

  Set files = folder.files
  for each file in files
    relativePath = mid(file.path,len(sourceFolderPath)+1)
    relativePath = replace(relativePath,"\","/")
    controlFile.writeline owner & id & step & lpad(targetFolderPath & relativePath, 700) & file.path    
  Next

  Set SubFolders = folder.SubFolders
  For each SubFolder in SubFolders
    processFolder controlFile, SubFolder, owner, id, step, sourceFolderPath, targetFolderPath
  Next
        
End Sub

Sub generateControlFile(INSTALLER, FSO, folderPath, targetFolderPath, owner, demoName, demoStep, controlFilePath)

  dim controlFile, folder, paddedOwner, paddedName, paddedStep
     
  If FSO.fileExists(controlFilePath) Then
    Set controlFile = FSO.getFile(controlFilePath)
    controlFile.delete(TRUE)
  End If

  paddedOwner = lpad(owner,32)
  paddedName  = lpad(demoName,64)
  paddedStep  = lpad(demoStep,12)
  
  Set controlFile = FSO.createTextFile(controlFilePath)
  controlFile.writeline "load data"
  controlFile.writeline "infile *"
  controlFile.writeline INSTALLER.replaceMacros("append into table %XFILES_SCHEMA%.XFILES_DOCUMENT_STAGING",false)
  controlFile.writeline "("
  controlFile.writeline "  DEMONSTRATION_OWNER        CHAR(32),"
  controlFile.writeline "  DEMONSTRATION_NAME         CHAR(64)," 
  controlFile.writeline "  DEMONSTRATION_STEP         CHAR(12),"
  controlFile.writeline "  DOCUMENT_PATH              CHAR(700),"
  controlFile.writeline "  SOURCE_PATH         FILLER CHAR(700),"
  controlFile.writeline "  DOCUMENT_CONTENT           LOBFILE(SOURCE_PATH) terminated by eof"
  controlFile.writeline ")"
  controlFile.writeline "BEGINDATA"  
 

  Set folder = FSO.getFolder(folderPath)
  processFolder controlFile, folder, paddedOwner, paddedName, paddedStep, folderPath, targetFolderPath

  controlFile.close
 
End Sub
  
Sub stageRepositoryContent(CONFIGURAITON, stepID, localFolderPath, remoteFolderPath)

     Dim controlFilePath
     controlFilePath = INSTALLER.getInstallFolderPath() + "\sqlldr.ctl"
      
     writeLogMessage "SQLLDR : Type = 'StageContent'. Step = '" + stepId + "'. Local Folder = '" + localFolderPath + ". Remote Folder = '" + remoteFolderPath + "'."  

	   SQLPLUS.execute INSTALLER.getUsername(), INSTALLER.getPassword(), "sql/deleteContent " & INSTALLER.getDemoFolderName() & " " & stepId & " " & INSTALLER.replaceMacros("%XFILES_SCHEMA%",false)
		 generateControlFile INSTALLER, INSTALLER.getFSO(), localFolderPath, remoteFolderPath, INSTALLER.getUsername(), INSTALLER.get3(), stepId, controlFilePath
		 SQLLDR.execute INSTALLER.getUsername(), INSTALLER.getPassword(), controlFilePath

End Sub

Sub sqlldrJobs(INSTALLER)

  Dim nodeList, i, job, jobType, stepId, localFolderPath, remoteFolderPath, controlFilePath
    
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/sqlldr/jobs/job")

  For i = 0 to nodeList.length - 1
     Set job = nodeList.item(i)
     jobType = job.getAttribute("type")
     
     If jobType = "stageResources" Then
       stepId = job.getAttribute("stepId")
       localFolderPath = XHELPER.getTextNode(job,"localFolder")
       remoteFolderPath = XHELPER.getTextNode(job,"remoteFolder")
     	 stageRepositoryContent INSTALLER, stepId, localFolderPath, remoteFolderPath
     End If
     	 
     If jobType = "dataLoad"  Then	 
       controlFilePath = XHELPER.getOptionalTextNode(job,"controlFile")
       writeLogMessage "SQLLDR : Type = 'dataLoad'. Control File = '" + controlFilePath + "'."  
       SQLLDR.execute INSTALLER.getUsername(), INSTALLER.getPassword(), controlFilePath
     End If
      
  Next 
 
End Sub 

Sub cloneArchives(INSTALLER,FILEMANAGER)
 
  Dim nodeList, i, source, target, folder
    
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/cloneList/archives/archive")

  For i = 0 to nodeList.length - 1
     source  = XHELPER.getTextNode(nodeList.item(i),"source")
     folder  = XHELPER.getTextNode(nodeList.item(i),"folder")
     target  = XHELPER.getTextNode(nodeList.item(i),"target")
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then
       writeLogMessage "Clone Archives : Archive = '" + source + "'. Target = '" + target + "'."
       FILEMANAGER.unzipArchive source, folder
  	   FILEMANAGER.cloneFolder INSTALLER, folder, folder
       FILEMANAGER.createZipArchive target
       FILEMANAGER.zipArchive target, folder
     else
       SCRIPT_GENERATOR.unzipArchive source, folder
  	   SCRIPT_GENERATOR.cloneFolder INSTALLER, folder, folder
       SCRIPT_GENERATOR.createZipArchive target
       SCRIPT_GENERATOR.zipArchive target, folder
     End If
  Next 
  
End Sub

Sub createFolders(INSTALLER,FILEMANAGER)

  Dim nodeList, i, folder, folderPath 
  
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/make/folders/folder")
    
  For i = 0 to nodeList.length - 1
     Set folder = nodeList.item(i)
     folderPath = INSTALLER.replaceMacros(folder.text,false)
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then
       writeLogMessage "CreateFolder : '" + folderPath + "'"
       FILEMANAGER.createEmptyFolder(folderPath)
     Else
     	 SCRIPT_GENERATOR.newFolderScript(folderPath)
     End If
  Next 
  
End Sub

Sub copyFiles(INSTALLER,FILEMANAGER)
 
  Dim nodeList, i, sourceFile, targetFile
    
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/copy/files/file")

  For i = 0 to nodeList.length - 1
     sourceFile = XHELPER.getTextNode(nodeList.item(i),"source")
     targetFile = XHELPER.getTextNode(nodeList.item(i),"target")
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then
       writeLogMessage "Copy File : Source = '" + sourceFile + "'. Target = '" + targetFile + "'" 
       FILEMANAGER.copyFile INSTALLER, sourceFile, targetFile
     Else
     	 SCRIPT_GENERATOR.CopyFile INSTALLER, sourceFile, targetFile
     End If
  Next 
  
End Sub

Sub copyFolders(INSTALLER,FILEMANAGER)

  Dim nodeList, i, sourceFolder, targetFolder
  
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/copy/folders/folder")

  For i = 0 to nodeList.length - 1
     sourceFolder      = XHELPER.getTextNode(nodeList.item(i),"source")
     targetFolder      = XHELPER.getTextNode(nodeList.item(i),"target")
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then
       writeLogMessage "Copy Folder : Source = '" + sourceFolder + "'. Target = '" + targetFolder + "'"
       FILEMANAGER.copyFolder INSTALLER, sourceFolder, targetFolder
     Else
     	 SCRIPT_GENERATOR.CopyFolder INSTALLER, sourceFolder, targetFolder
     End If
     
  Next 
  
End Sub

Sub cloneFiles(INSTALLER,FILEMANAGER)

  Dim nodeList, i, sourceFile, targetFile 
  
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/clone/files/file")

  For i = 0 to nodeList.length - 1
     sourceFile = XHELPER.getTextNode(nodeList.item(i),"source")
     targetFile = XHELPER.getTextNode(nodeList.item(i),"target")
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
       writeLogMessage "Clone File : Source = '" + sourceFile + "'. Target = '" + targetFile + "'"
       FILEMANAGER.cloneFile INSTALLER, sourceFile, targetFile
     Else
     	 SCRIPT_GENERATOR.cloneFile INSTALLER, sourceFile, targetFile
     End if
  Next 
  
End Sub

Sub cloneFolders(INSTALLER,FILEMANAGER)

  Dim nodeList, i, sourceFolder, targetFolder
  
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/clone/folders/folder")

  For i = 0 to nodeList.length - 1
     sourceFolder = XHELPER.getTextNode(nodeList.item(i),"source")
     targetFolder = XHELPER.getTextNode(nodeList.item(i),"target")
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
       writeLogMessage "Clone Folder : Source = '" + sourceFolder + "'. Target = '" + targetFolder + "'"
       FILEMANAGER.cloneFolder INSTALLER, sourceFolder, targetFolder
     Else
     	 SCRIPT_GENERATOR.cloneFolder INSTALLER, sourceFolder, targetFolder
     End if
  Next 
  
End Sub

Sub unzipArchives(INSTALLER,FILEMANAGER)
 
  Dim nodeList, i, archive, target, clone
    
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/unzip/archives/archive")

  For i = 0 to nodeList.length - 1
     archive = XHELPER.getTextNode(nodeList.item(i),"source")
     target  = XHELPER.getTextNode(nodeList.item(i),"target")
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
       writeLogMessage "Unzip Archives : Archive = '" + archive + "'. Target = '" + target + "'."
       FILEMANAGER.unzipArchive archive, target
     Else
     	 SCRIPT_GENERATOR.unzipArchive archive, target
     End if
  Next 
  
End Sub

Sub makeWebFolders(REPOS)

  ' Added NLS Support - Web Folders Targets must exist,

  Dim nodeList, i, URL, shortCutName, shortcutLocation, expandedURL 
  
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/WEBDAV/shortCut")

  For i = 0 to nodeList.length - 1
     URL = XHELPER.getTextNode(nodeList.item(i),"URL")
     shortCutName = XHELPER.getTextNode(nodeList.item(i),"name")
     shortcutLocation = XHELPER.getTextNode(nodeList.item(i),"location")
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
       REPOS.makeWebFolder shortCutName, URL, shortcutLocation
     Else
  	   SCRIPT_GENERATOR.makeWebFolder shortCutName, URL, shortcutLocation
     End If

  Next 

End Sub

Function validateRemotePath(INSTALLER, target)

   Dim folder, currentOperation, offset, errorMessage
   
   On Error Resume Next
   folder = INSTALLER.getFSO().GetFolder(target)
   If (Err.number <> 0) then
     If (Err.number = 76) then
   	   writeLogMessage "validateRemotePath: Unable to validate path : " & target
     Else
       errorMessage = "validateRemotePath: Error " & Err.number & " accessing : " & target
       exitFatalError(errorMessage)
     End if 
   End If
   
   currentOperation = "validateRemotePath: Successfully validated path '" & target & "'."
   writeLogMessage currentOperation
   validateRemotePath = folder
 
End Function

Sub makeNetworkFolderShortcuts(INSTALLER, FILEMGR)

  ' WIndows 7 ( Vista ? ). Folder Shortcuts based on Drive letter mapped via MSFT WebClient Service.

  Dim nodeList, i, URL, shortCutName, shortcutLocation, target, directory, icon, arguments, folder, errorMessage
  
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/WEBDAV/shortCut")
  
  If (nodelist.length > 0) Then
  	  
    For i = 0 to nodeList.length - 1
      URL                = XHELPER.getTextNode(nodeList.item(i),"URL")
      shortCutName       = XHELPER.getTextNode(nodeList.item(i),"name")
      shortcutLocation   = XHELPER.getTextNode(nodeList.item(i),"location")
      target             = replace(INSTALLER.getDriveLetter() & URL,"/","\")
      
      If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
        folder = validateRemotePath(INSTALLER, target)
        FILEMANAGER.createJunctionPoint shortcutLocation, shortCutName, target
      Else
   	    SCRIPT_GENERATOR.createJunctionPoint shortcutLocation, shortCutName, target
      End If

    Next 
  End If
   
End Sub

Sub makeSqlShortCuts(INSTALLER,FILEMANAGER)

  Dim nodeList, sqlElement, shortcutType, i, shortcutName, script, url, remotePath
  
  Dim executeablePath, executionMode, defaultLandingPad, landingPad
  Dim defaultShortcutLocation, defaultScriptPrefix, defaultUsername, defaultPassword, defaultTNSAlias, defaultArguments, defaultIconPath
  Dim shortcutLocation, scriptPrefix, username, password, tnsAlias, arguments, iconPath, rerunnable
    
  Set nodelist = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/SQL")  
  executionMode = nodeList.item(0).getAttribute("executionMode")
    
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/SQL/defaults")
  For i = 0 to nodeList.length - 1
    defaultShortcutLocation   = XHELPER.getDefaultTextNode(nodeList.item(i),"location",INSTALLER.getShortcutFolderPath())
    defaultUsername           = XHELPER.getDefaultTextNode(nodeList.item(i),"username",INSTALLER.getUsername())
    defaultPassword           = XHELPER.getDefaultTextNode(nodeList.item(i),"password",INSTALLER.getPassword())
    defaultTNSAlias           = XHELPER.getDefaultTextNode(nodeList.item(i),"tnsAlias",INSTALLER.getTNSAlias())
    defaultIconPath           = XHELPER.getDefaultTextNode(nodeList.item(i),"icon","%DEMODIRECTORY%\Install\SQLPLUS.ICO")

    defaultLandingPad         = XHELPER.getOptionalTextNode(nodeList.item(i),"serverLandingPad")
    defaultScriptPrefix       = XHELPER.getOptionalTextNode(nodeList.item(i),"scriptPrefix")
    defaultArguments          = XHELPER.getOptionalTextNode(nodeList.item(i),"arguments")                                     
  Next 

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/SQL/shortCut")

  For i = 0 to nodeList.length - 1
    landingPad         = XHELPER.getDefaultTextNode(nodeList.item(i),"landingPad",defaultLandingPad)
    shortcutLocation   = XHELPER.getDefaultTextNode(nodeList.item(i),"location",defaultShortcutLocation)
    scriptPrefix       = XHELPER.getDefaultTextNode(nodeList.item(i),"scriptPrefix",defaultScriptPrefix)
    username           = XHELPER.getDefaultTextNode(nodeList.item(i),"username",defaultUsername)
    password           = XHELPER.getDefaultTextNode(nodeList.item(i),"passsword",defaultPassword)
    tnsAlias           = XHELPER.getDefaultTextNode(nodeList.item(i),"tnsAlias",defaultTNSAlias)
    arguments          = XHELPER.getDefaultTextNode(nodeList.item(i),"arguments",defaultArguments)                                    
    iconPath           = XHELPER.getDefaultTextNode(nodeList.item(i),"icon",defaultIconPath)
    rerunnable         = XHELPER.getDefaultTextNode(nodeList.item(i),"rerunnable","false")

    shortcutName       = XHELPER.getTextNode(nodeList.item(i),"name")
    script             = XHELPER.getTextNode(nodeList.item(i),"script")


		If (not INSTALLER.isScriptGenerator()) Then
      If (executionMode = "local") Then
        arguments       = INSTALLER.replaceMacros( username & "/" & password & "@" & tnsAlias & " " + chr(34) + "@%DEMODIRECTORY%\Install\sql\executeAndPause.sql" & chr(34) & " " & chr(34) + "%DEMODIRECTORY%\%USER%" & script + chr(34),false)
        FILEMANAGER.makeShortCut INSTALLER, shortcutLocation, shortcutName, INSTALLER.getSQLPLusPath(), iconPath, null, arguments
      Else
    	  ' Assume remote (HTTP) based SQL Execution
        url = INSTALLER.replaceMacros(INSTALLER.getServerURL() & landingPad & "&target=" & scriptPrefix & script & "&description=" & shortCutName & "&sqlUsername=" & username,false)
        FILEMANAGER.makeHttpShortCut shortcutLocation, shortcutName, url, iconPath, ""
      End If
		End If
		
    DEMONSTRATION.addSQLStep shortcutName, scriptPrefix & script, "SQLPLUS.png", username, rerunnable
     
  Next 
  
End Sub

Sub makeHttpShortCuts(INSTALLER, FILEMANAGER)

  Dim nodeList, i, shortcutName, url, windowName, screenshot

  Dim defaultShortcutLocation, defaultUsername, defaultIconPath, defaultArguments
  Dim shortcutLocation, username, iconPath, arguments

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/HTTP/defaults")
  For i = 0 to nodeList.length - 1
    defaultShortcutLocation   = XHELPER.getDefaultTextNode(nodeList.item(i),"location",INSTALLER.getShortcutFolderPath())
    defaultUsername           = XHELPER.getDefaultTextNode(nodeList.item(i),"username",INSTALLER.getUsername())
    defaultIconPath           = XHELPER.getOptionalTextNode(nodeList.item(i),"icon")

    defaultArguments          = XHELPER.getOptionalTextNode(nodeList.item(i),"arguments")
  Next 

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/HTTP/shortCut")

  For i = 0 to nodeList.length - 1
    shortcutLocation   = XHELPER.getDefaultTextNode(nodeList.item(i),"location",defaultShortcutLocation)
    username           = XHELPER.getDefaultTextNode(nodeList.item(i),"username",defaultUsername)
    iconPath           = XHELPER.getDefaultTextNode(nodeList.item(i),"icon",defaultIconPath)
    arguments          = XHELPER.getDefaultTextNode(nodeList.item(i),"arguments",defaultArguments)                                    

    shortcutName       = XHELPER.getTextNode(nodeList.item(i),"name")
    url                = XHELPER.getTextNode(nodeList.item(i),"URL")

    screenshot         = XHELPER.getOptionalTextNode(nodeList.item(i),"screenshot")
    windowName         = XHELPER.getOptionalTextNode(nodeList.item(i),"target")

    If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
	    FILEMANAGER.makeHttpShortCut shortcutLocation, shortcutName, url, iconPath, arguments
    End If

    DEMONSTRATION.addHTTPStep shortcutName, url, "HTTP.png", username, screenshot, windowName
  Next 
  
End Sub

Sub makeViewerShortCuts(INSTALLER, FILEMANAGER)

  ' LocalViewer is the viewer used when running inside the XFILES Application
  ' RemoteViewer is te viewer used when running from Operating System.

  Dim nodeList, i, shortcutName, target 

  Dim defaultShortcutLocation, defaultPathPrefix, defaultUsername, defaultIconPath, defaultArguments, defaultRemoteViewer, defaultLocalViewer, defaultContentType
  Dim shortcutLocation, pathPrefix, username, iconPath, arguments, remoteViewer, localViewer, contentType
  Dim URL, localURL, remoteURL

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/VIEW/defaults")
  For i = 0 to nodeList.length - 1
    defaultShortcutLocation   = XHELPER.getDefaultTextNode(nodeList.item(i),"location",INSTALLER.getShortcutFolderPath())
    defaultUsername           = XHELPER.getDefaultTextNode(nodeList.item(i),"username",INSTALLER.getUsername())
    defaultIconPath           = XHELPER.getOptionalTextNode(nodeList.item(i),"icon")

    defaultRemoteViewer       = XHELPER.getOptionalTextNode(nodeList.item(i),"remoteViewer")
    defaultLocalViewer        = XHELPER.getOptionalTextNode(nodeList.item(i),"localViewer")
    defaultContentType        = XHELPER.getOptionalTextNode(nodeList.item(i),"contentType")
    defaultPathPrefix         = XHELPER.getOptionalTextNode(nodeList.item(i),"pathPrefix")
    defaultArguments          = XHELPER.getOptionalTextNode(nodeList.item(i),"arguments")                                 
  Next 

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/VIEW/shortCut")

  For i = 0 to nodeList.length - 1
    shortcutLocation   = XHELPER.getDefaultTextNode(nodeList.item(i),"location",defaultShortcutLocation)
    username           = XHELPER.getDefaultTextNode(nodeList.item(i),"username",defaultUsername)
    iconPath           = XHELPER.getDefaultTextNode(nodeList.item(i),"icon",defaultIconPath)

    remoteViewer       = XHELPER.getDefaultTextNode(nodeList.item(i),"remoteViewer",defaultRemoteViewer)
    localViewer        = XHELPER.getDefaultTextNode(nodeList.item(i),"localViewer",defaultLocalViewer)
    contentType        = XHELPER.getDefaultTextNode(nodeList.item(i),"contentType",defaultContentType)
    pathPrefix         = XHELPER.getDefaultTextNode(nodeList.item(i),"pathPrefix",defaultPathPrefix)
    arguments          = XHELPER.getDefaultTextNode(nodeList.item(i),"arguments",defaultArguments)                                  

    shortcutName       = XHELPER.getTextNode(nodeList.item(i),"name")
    target             = XHELPER.getTextNode(nodeList.item(i),"target")

    URL = pathPrefix & target
    
		If Not isNULL(arguments) and (arguments <> "") Then	   
			URL = URL + "?" + arguments
	  End if
	  
    if (localViewer <> "") then
    	localURL = localViewer & "&target=" & URL
    else
      localURL = INSTALLER.getServerURL() & URL    	
    end if

    remoteURL = URL
    If (remoteViewer <> "")  Then
      remoteURL = INSTALLER.getServerURL() & remoteViewer & "?target="  & URL
    else
      remoteURL = INSTALLER.getServerURL() & URL   	
    End if    
    
    If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then
      FILEMANAGER.makeHttpShortCut shortcutLocation, shortcutName, remoteURL , iconPath, NULL
    End if
    
    DEMONSTRATION.addViewerStep shortcutName, localURL, "HTTP.png", username, contentType
  Next 
  
End Sub


Sub makeFtpScripts(INSTALLER,FILEMANAGER)
  
  Dim scriptFilename, scriptFile, targetDirectory, ftpCommand, ftpFile
  
  Dim nodeList, i, commandNodeList, c

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/FTP/scripts/script")

  For i = 0 to nodeList.length - 1

     scriptFileName  = XHELPER.getTextNode(nodeList.item(i),"name")
     scriptFile      = INSTALLER.getScriptsFolderPath() & FILE_SEPERATOR &scriptFileName + ".ftp"
     targetDirectory = XHELPER.getTextNode(nodeList.item(i),"URL")

     Set ftpFile = FILEMANAGER.CreateTextFile(scriptFile)
     createFtpScript ftpFile, INSTALLER.getHostName(), INSTALLER.getFtpPort(), _
                     INSTALLER.getUsername(), INSTALLER.getPassword(), targetDirectory

     Set commandNodeList = nodeList(i).getElementsByTagName("command")
                        
     For c = 0 to commandNodeList.length - 1
       ftpCommand = commandNodeList.item(c).text
       ftpFile.writeline(ftpCommand)
     Next 
     ftpFile.writeline("")
     ftpFile.close
  Next 
  
End Sub

Sub createFTPScript(ftpFile, hostname, port, user, password, remoteDirectory)

  ftpFile.writeline("open " & hostname & " " & port)
  ftpFile.writeline("user " & user & " " & password)
  ftpFile.writeline("cd " & remoteDirectory)

End Sub

Function getRemoteIcon(target)

  If (isNull(target)) Then
  	getRemoteIcon = "EXPLORER.png"
    Exit Function
  End If
 
  If (UCase(right(target,len("\CMD.EXE"))) = "\CMD.EXE") Then
  	getRemoteIcon = "CommandWindow.png"
    Exit Function
  End If

  If (UCase(right(target,len("\WINWORD.EXE"))) = "\WINWORD.EXE") Then
 	  getRemoteIcon = "MicrosoftWord.png"
    Exit Function
  End If

  If (UCase(right(target,len("\EXCEL.EXE"))) = "\EXCEL.EXE") Then
    getRemoteIcon = "MicrosoftExcel.png"
    Exit Function
  End If

  If (UCase(right(target,len("\FTP.EXE"))) = "\FTP.EXE") Then
    getRemoteIcon = "FTP.png"
    Exit Function
  End If

  getRemoteIcon = "EXPLORER.png"
  Exit Function

End Function

Function processSimulation(simulation, shortcutName, defaultLinkFolder, defaultScreenshotFolder) 

  ' Calculate the settings for the remote version
  '
  ' remote Icon  : The Icon for the Left Hand Panel
  ' linkLocation : The .lnk file for this step
  ' screenshot   : The Image for the Right Hand Panel (Main Form)
  ' simulation   : Details on how to simulate this option in a Web-only environment.

  Dim DOCUMENT, simulationDetails, linkFolder, link, screenshotFolder, screenshot, url, SQL

  Set DOCUMENT = CreateObject("Msxml2.FreeThreadedDOMDocument.6.0")

  Set simulationDetails = DOCUMENT.createElement("simulation")
  simulationDetails.setAttribute "type", XHELPER.getOptionalTextNode(simulation,"type")
  
  linkFolder         = XHELPER.getDefaultTextNode(simulation,"remoteLinkLocation",defaultLinkFolder)
  link               = linkFolder & "/" & shortcutName & ".lnk"
  simulationDetails.setAttribute "lnkPath", link
  
  screenshotFolder   = XHELPER.getDefaultTextNode(simulation,"screenshotLocation",defaultScreenshotFolder)
  screenshot         = screenshotFolder & "/" & XHELPER.getOptionalTextNode(simulation,"screenshot")
  simulationDetails.setAttribute "screenshotPath", screenshot
  
  url         = XHELPER.getOptionalTextNode(simulation,"URL")
  if (not IsNull(url)) then
  	simulationDetails.setAttribute "URL", url
  End if

  SQL         = XHELPER.getOptionalTextNode(simulation,"SQL")
  if (not IsNull(SQL)) then
  	simulationDetails.setAttribute "SQL", SQL
  End if
      
  Set processSimulation = simulationDetails
  
End Function


Sub makeGeneralShortCuts(INSTALLER,FILEMANAGER)


  Dim nodeList, i
  Dim defaultShortcutFolder, defaultLinkFolder, defaultScreenshotFolder  

  defaultShortcutFolder   = INSTALLER.getShortcutFolderPath()

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/General/defaults")
  For i = 0 to nodeList.length - 1
    defaultLinkFolder         = XHELPER.getDefaultTextNode(nodeList.item(i),"remoteLinkLocation","%DEMOLOCAL%/Links")
    defaultScreenshotFolder   = XHELPER.getDefaultTextNode(nodeList.item(i),"screenshotLocation","%DEMOCOMMON%/assets")
  Next
  
  Dim shortCutName, shortcutFolder, target, directory, icon, arguments, remoteIcon 
  Dim nlSimulation, simulation
  
  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/General/shortCut")

  For i = 0 to nodeList.length - 1
    shortCutName       = XHELPER.getTextNode(nodeList.item(i),"name")
    shortcutFolder     = XHELPER.getDefaultTextNode(nodeList.item(i),"location",defaultShortcutFolder)
    target             = XHELPER.getOptionalTextNode(nodeList.item(i),"path")
    directory          = XHELPER.getOptionalTextNode(nodeList.item(i),"directory")
    icon               = XHELPER.getOptionalTextNode(nodeList.item(i),"icon")
    arguments          = XHELPER.getOptionalTextNode(nodeList.item(i),"arguments")
    
    If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then
      FILEMANAGER.makeShortCut INSTALLER, shortcutFolder, shortCutName, target, icon, directory, arguments
    End if
        
    Set nlSimulation   = nodeList.item(i).getElementsByTagName("simulation")
    If nlSimulation.length > 0 Then
      Set simulation   = processSimulation(nlSimulation.item(0), shortCutName, defaultLinkFolder, defaultScreenshotFolder)
    Else
    	Set simulation   = NULL
    End If

    DEMONSTRATION.addShellCmdStep shortcutName, INSTALLER.getUsername(), getRemoteIcon(target), simulation

  Next 
  
End Sub
 
Sub makeFavorites(INSTALLER,FILEMANAGER)

  Dim nodeList, i, linkFolderName, linkFolderPath, shortCutName, shortcutLocation, target, arguments, icon, screenshot, windowName

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/Favorites/shortCut")

  If (nodeList.length > 0) Then
    linkFolderName = INSTALLER.getDemonstrationParameter("/installerConfiguration/Favorites/folder").item(0).text
    If linkFolderName = "" Then
      linkFolderName = "Oracle XML DB Demonstration"
    End If
    linkFolderPath = FILEMANAGER.makeFavoritesFolder(linkFolderName)
    
    For i = 0 to nodeList.length - 1
      shortCutName       = XHELPER.getTextNode(nodeList.item(i),"name")
      target             = INSTALLER.getServerURL() & XHELPER.getTextNode(nodeList.item(i),"localPath")
      shortcutLocation   = XHELPER.getOptionalTextNode(nodeList.item(i),"location")
      arguments          = XHELPER.getOptionalTextNode(nodeList.item(i),"arguments")
      icon               = XHELPER.getOptionalTextNode(nodeList.item(i),"icon")

      screenshot         = XHELPER.getOptionalTextNode(nodeList.item(i),"screenshot")
      windowName         = XHELPER.getOptionalTextNode(nodeList.item(i),"target")

      FILEMANAGER.makeHttpShortCut shortcutLocation, shortCutName,  target, icon, arguments
      DEMONSTRATION.addHTTPStep shortcutName, target, icon, INSTALLER.getUsername(),screenshot, windowName
    Next 
  End If
  
End Sub

Sub makeFolderShortcuts(INSTALLER, FILEMANAGER, REPOS)

  If INSTALLER.getWindowsVersion >= 6.1 Then
    makeNetworkFolderShortcuts INSTALLER, FILEMANAGER
  Else
    makeWebFolders REPOS    
  End If

End sub

Sub SaveConfiguration (REPOS, remoteDirectory, user, password)

		If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
      REPOS.uploadContent DEMONSTRATION.DOCUMENT, remoteDirectory & "/configuration.xml", True, user, password
    else
    	SCRIPT_GENERATOR.uploadConfiguation DEMONSTRATION.DOCUMENT, remoteDirectory & "/configuration.xml", True, user, password
    End If

End Sub

Sub makeLaunchPadEntry(INSTALLER, FILEMANAGER, shortCutType, shortCutName, shortcutLocation, target, icon, directory, arguments)

    ' Ensure the Launch Pad Folder exists

    If (INSTALLER.isInteractiveInstall()or NOT (MINSTALLER Is Nothing)) Then

      FILEMANAGER.makeFolder shortcutLocation

      If (shortCutType = "url") Then
        FILEMANAGER.makeHttpShortcut shortcutLocation, shortcutName, target, icon, arguments  
      End If
    
      If (shortCutType = "lnk") Then
	      FILEMANAGER.makeShortCut INSTALLER, shortcutLocation, shortCutName, target, icon, directory, arguments
      End If

    Else
    	SCRIPT_GENERATOR.launchShellScript shortcutName,target,shortCutType
    End If  
    
End Sub

Sub makeLaunchPadEntries(INSTALLER,FILEMANAGER)

  Dim  i, nodeList, shortCut, shortCutType, shortCutName, shortcutLocation, target, directory, icon, arguments, remoteLinkLocation, remoteIcon, screenshot, simulation

  Set nodeList = INSTALLER.getDemonstrationParameter("/installerConfiguration/shortCuts/LAUNCH/shortCut")

  For i = 0 to nodeList.length - 1
    Set shortCut       = nodeList.item(i)
    shortCutType       = shortCut.getAttribute("type")
    shortCutName       = XHELPER.getTextNode(shortCut,"name")
    shortcutLocation   = XHELPER.getDefaultTextNode(shortCut,"location",Installer.getLaunchPadFolderPath())
    target             = XHELPER.getOptionalTextNode(shortCut,"target")
    icon               = XHELPER.getOptionalTextNode(shortCut,"icon")
    directory          = XHELPER.getOptionalTextNode(shortCut,"directory")
    arguments          = XHELPER.getOptionalTextNode(shortCut,"arguments")

    makeLaunchPadEntry INSTALLER, FILEMANAGER, shortCutType, shortCutName, shortcutLocation, target, icon, directory, arguments

  Next 
  
End Sub

Sub ProcessFileUploadList(fileList)

  Dim  i, nodeList, action, actionType, user, password, mode, local, remote, stepDescription, scriptFile
  Set nodeList = fileList.getElementsByTagName("action")

  If INSTALLER.useFtpProtocol() Then
    writeLogMessage "FTP File Upload enabled"
    Set newFolderList = CreateObject("Scripting.Dictionary")
  End if

  For i = 0 to nodeList.length - 1
    Set action = nodeList.item(i)
    actionType = action.getAttribute("type")
    user       = INSTALLER.replaceMacros(action.getAttribute("user"),false)
    password   = INSTALLER.replaceMacros(action.getAttribute("password"),false)
    
    Select Case actionType
      Case "PUT" 
        mode   = XHELPER.getDefaultTextNode(action,"mode","SKIP")
        local  = XHELPER.getTextNode(action,"local")
        remote = XHELPER.getTextNode(action,"remote")
        stepDescription = "  PUT : '" & local & "' --> '" & remote & "'."
        writeLogMessage stepDescription
        REPOS.uploadFile local, remote, mode, user, password
        stepDescription = stepDescription & " Status = " & REPOS.getXHR().status & " [" + REPOS.getXHR().statusText + "]."
        writeLogMessage stepDescription
      Case "MKCOL" 
        mode   = XHELPER.getTextNode(action,"mode") = "FORCE"
        remote = XHELPER.getTextNode(action,"remote")
        stepDescription = "  MKDIR : '" & remote & "'."
        writeLogMessage stepDescription
        REPOS.makeDir remote, mode, user, password
        stepDescription = stepDescription & " Status = " & REPOS.getXHR().status & " [" + REPOS.getXHR().statusText + "]."
        writeLogMessage stepDescription
      Case "DELETE" 
        mode   = XHELPER.getTextNode(action,"mode") = "FORCE"
        remote = XHELPER.getTextNode(action,"remote")
        stepDescription = "  DELETE : '" & remote & "'."
        writeLogMessage stepDescription
        REPOS.doDelete remote, user, password
        stepDescription = stepDescription & " Status = " & REPOS.getXHR().status & " [" + REPOS.getXHR().statusText + "]."
        writeLogMessage stepDescription
    End Select
    
  next

  If INSTALLER.useFtpProtocol() Then
    writeLogMessage "  Commencing FTP Upload"
  	scriptFile = REPOS.runFtpScript
    writeLogMessage "  FTP Upload Completed for '" & scriptFile & "'."
  End if
    
End Sub
 
Sub doAction(action,step) 

  Dim actionType, user, password, sqlScript, mode, local, remote, stepDescription
 
  actionType = action.getAttribute("type")
  user       = INSTALLER.replaceMacros(action.getAttribute("user"),false)
  password   = INSTALLER.replaceMacros(action.getAttribute("password"),false)
  
  ' MsgBox "Action Type """  & actionType & """.",vbOK

  Select Case actionType
    Case "SYSDBA"
      sqlScript = INSTALLER.replaceMacros(action.text,false)
      stepDescription = "Step " & step & " SQLDBA : '" & INSTALLER.replaceMacros(action.text,true) & "'."
      writeLogMessage stepDescription
	    SQLPLUS.sysdba user, password, sqlScript
    Case "RUNSQL"
      sqlScript = INSTALLER.replaceMacros(action.text,false)
      stepDescription = "Step " & step & " RUNSQL : '" & INSTALLER.replaceMacros(action.text,true) & "'."
      writeLogMessage stepDescription
	    SQLPLUS.execute user, password, sqlScript
	  Case "UPLOAD"
      stepDescription = "Step " & step & " Upload Files."
      writeLogMessage stepDescription
	    processFileUploadList action
    Case "MAKEFOLDERS" 
      stepDescription = "Step " & step & " Create Folders."
      writeLogMessage stepDescription
      createFolders INSTALLER,FILEMANAGER
    Case  "COPYFOLDERS" 
      stepDescription = "Step " & step & " Copy Folders."
      writeLogMessage stepDescription
      copyFolders INSTALLER,FILEMANAGER
    Case "COPYFILES" 
      stepDescription = "Step " & step & " Copy Files."
      writeLogMessage stepDescription
      copyFiles INSTALLER,FILEMANAGER
    Case "UNZIP" 
      stepDescription = "Step " & step & " Unzip Archives."
      writeLogMessage stepDescription
      unzipArchives INSTALLER,FILEMANAGER
    Case "CLONEFOLDERS" 
      stepDescription = "Step " & step & " Clone Folders."
      writeLogMessage stepDescription
      cloneFolders INSTALLER,FILEMANAGER
    Case "CLONEFILES" 
      stepDescription = "Step " & step & " Clone Files."
      writeLogMessage stepDescription
      cloneFiles INSTALLER,FILEMANAGER
    Case "CLONEZIPS" 
      stepDescription = "Step " & step & " Clone Archives."
      writeLogMessage stepDescription
      cloneArchives INSTALLER,FILEMANAGER
    Case "SQLLDR" 
      stepDescription = "Step " & step & " SQLLDR Jobs."
      writeLogMessage stepDescription
      sqlldrJobs INSTALLER
    Case "DAV"
      stepDescription = "Step " & step & " Remote Folder Shortcuts."
      writeLogMessage stepDescription
      makeFolderShortcuts INSTALLER, FILEMANAGER, REPOS
    Case "FTP" 
      stepDescription = "Step " & step & " FTP scripts."
      writeLogMessage stepDescription
      makeFtpScripts INSTALLER,FILEMANAGER
    Case "SQL" 
      stepDescription = "Step " & step & " SQL scripts."
      writeLogMessage stepDescription
      makeSQLShortCuts INSTALLER,FILEMANAGER
    Case "HTTP" 
      stepDescription = "Step " & step & " HTTP URLs."
      writeLogMessage stepDescription
      makeHttpShortCuts INSTALLER, FILEMANAGER
    Case "SHELL"
      stepDescription = "Step " & step & " Shell Commands."
      writeLogMessage stepDescription
      makeGeneralShortCuts INSTALLER, FILEMANAGER
    Case "VIEW" 
      stepDescription = "Step " & step & " Show Documents."
      writeLogMessage stepDescription
      makeViewerShortcuts INSTALLER,FILEMANAGER
    Case "FAVORITES" 
      stepDescription = "Step " & step & " Create Favorites entries."
      writeLogMessage stepDescription
      makeFavorites INSTALLER,FILEMANAGER
    Case "DEMOCONFIG" 
      remote = XHELPER.getTextNode(action,"remote")
      stepDescription = "Step " & step & " Save demonstration Configuration."
      writeLogMessage stepDescription
      saveConfiguration REPOS, remote, user, password
    Case "LAUNCH"
      stepDescription = "Step " & step & " Launch Shortcuts."
      writeLogMessage stepDescription
      makeLaunchPadEntries INSTALLER,FILEMANAGER
  End Select
  
End Sub

Sub takeNextAction()

  DIM progressIndicator, percentComplete

  Set progressIndicator = document.getElementById("ProgressBar")
 
  If (ACTION_INDEX < ACTION_LIST.length) Then
    percentComplete = round(ACTION_INDEX/ACTION_LIST.Length * 100) 
    If (percentComplete = 0) Then
      progressIndicator.innerHTML = "<table width=""100%""><tbody><tr width=""100%""><td/><td width=""100%"" height=""10px""/></tr></table>"
    Else
      progressIndicator.innerHTML = "<table width=""100%""><tbody><tr width=""100%""><td width=""" & percentComplete & "%"" height=""10px"" style=""background-color:green;""/><td/></tr></table>"
    End If
    CURRENTTIMER = Window.setTimeOut("doInstallAction",10,"VBSCRIPT")
  Else
    progressIndicator.innerHTML = "<table width=""100%""><tbody><tr width=""100%""><td width=""100%"" height=""10px"" style=""background-color:green;""/><td/></tr></table>"
    CURRENTTIMER = Window.setTimeOut("doPostInstallActions",10,"VBSCRIPT")
  End If
 
End Sub

Sub doInstallAction()

  Dim action, step
  
  Window.clearTimeOut(CURRENTTIMER)
  
  Set action = ACTION_LIST.item(ACTION_INDEX)
  step = ACTION_INDEX + 1
  
  doAction action,step
   
  ACTION_INDEX = ACTION_INDEX + 1
  takeNextAction 
  
End Sub

Sub doInstallActions()

  Dim nodeList
  DEMONSTRATION.addDemonstrationRoot
  Set ACTION_LIST = INSTALLER.getDemonstrationParameter("/installerConfiguration/installation/action")
  ACTION_INDEX = 0
  takeNextAction 

End Sub

Sub ConfigureDatabase()
       
      DIM stepDescription

      stepDescription = "configureDatabase(): " + INSTALLER.getUsername + " " + INSTALLER.getPassword + " " + INSTALLER.getHTTPPort + " " + INSTALLER.getFTPPort
      writeLogMessage stepDescription
	    SQLPLUS.sysdba INSTALLER.getDBAUsername, INSTALLER.getDBAPassword, "sql/configureDatabase" + " " + INSTALLER.getUsername + " " + INSTALLER.getPassword + " " + INSTALLER.getHTTPPort + " " + INSTALLER.getFTPPort

End Sub

Sub doInstall()

  dim result
  dim installButton
  
  set installButton = document.getElementById("doInstall")
  installButton.disabled = true

  ' Load the values from the Installation Parameters Dialog
  
  INSTALLER.readInstallationDialog

  ' MsgBox "DEBUG : Validating Install Parameters",vbOK

  If (Not validOracleHome(INSTALLER)) Then
    installButton.disabled = false
    exit Sub
  End If

  ' MsgBox "DEBUG : Oracle Home - Passed",vbOK

  If (INSTALLER.requiresSYSDBA()) then
    If (Not validSYSDBA(INSTALLER,SQLPLUS)) Then
      installButton.disabled = false
      exit Sub
    End If
  End If

  ' MsgBox "DEBUG : SYSDBA - Passed",vbOK

  If (Not validDBA(INSTALLER,SQLPLUS)) Then
    installButton.disabled = false
    exit Sub
  End If

  ' MsgBox "DEBUG : DBA - Passed",vbOK

  If (Not validUsername(INSTALLER,SQLPLUS)) Then
    installButton.disabled = false
    exit Sub
  End If

  ' MsgBox "DEBUG : USER - Passed",vbOK

  If (Not validHTTPConnection(INSTALLER,REPOS)) Then
    installButton.disabled = false
    exit Sub
  End If
  
  ' MsgBox "DEBUG : HTTP - Passed",vbOK

  If (Not validDriveLetter(INSTALLER)) Then
    installButton.disabled = false
    exit Sub
  End If
  
  If Not(IsNull(INSTALLER.getDriveLetter())) Then 
    result = mapNetworkDrive(INSTALLER,FILEMANAGER)
    If (Not result) Then
      installButton.disabled = false
      Exit Sub
    End If
  End If

  ' MsgBox "DEBUG : Mapped Drive Letter - Passed",vbOK
  
  ' MsgBox "DEBUG : Validations complete - Starting Installation",vbOK
  
  doInstallActions

End sub

Sub doPostInstallActions()

  window.clearTimeOut(CURRENTTIMER)
  installationSuccessful INSTALLER  
  writeLogMessage "Installation Successful"
  writeLogFile LOGBUFFER
  self.close()
   
End Sub

Class fileSystemControl

  Public Function mapNetworkDrive(driveLetter, hostName, portNumber, user, password)
    
    Dim i, drive, oDrives, networkMgr, URL, windowsShareName, networkPath, errorMessage, currentOperation

    Set networkMgr = CreateObject("WScript.Network")
  
    URL = "http://" & hostName & ":" & portNumber 
    windowsShareName = "\\" & hostname & "@" & portNumber & "\DavWWWRoot"

    currentOperation = "  MAP NETWORK DRIVE '" & driveLetter & "'. Target => '" & windowsShareName & "'."
    writeLogMessage currentOperation
      
    On Error Resume Next
    Set drive = INSTALLER.getFSO().GetDrive(driveLetter)
    If Err.number = 0 Then
    	' Drive Letter in use
      If drive.DriveType = 3 Then
         Set oDrives = networkMgr.EnumNetworkDrives
         For i = 0 to oDrives.Count - 1 Step 2
           If UCase(oDrives.Item(i)) =  UCase(driveLetter) Then
             networkPath  = oDrives.Item(i+1)
             If UCase(networkPath) <> UCase(windowsShareName) Then
               errorMessage = "Unable to map Drive Letter '" & driveLetter & "' to '" & windowsShareName & "'. Drive already mapped to '" & networkPath & "'."
               exitFatalError(errorMessage)
             End If
          	 currentOperation = "  Using existing mapping for '" & driveLetter & "'. Target => '" & windowsShareName & "'. User = '" & user & "'."
             writeLogMessage currentOperation
             Break
           End If 	
         Next
      Else
      	errorMessage = "Unable to map Drive Letter '" & driveLetter & "' to '" & windowsShareName & "'. Drive Letter in Use."
        exitFatalError(errorMessage)
      End If 	
    Else
    	' Drive Letter already available
    	currentOperation = "  networkManager.mapNetworkDrive '" & driveLetter & "'. Target => '" & windowsShareName & "'. User = '" & user & "'."
      writeLogMessage currentOperation
      networkMgr.MapNetworkDrive driveLetter, windowsShareName, true, user, password
      If Err.number  <> 0 Then
      	If Err.number = 68 Then
      		' Device Not ready.. Assume Timing issue...
      	  Exit Function
      	End if
        errorMessage = "Unable to Map Drive Letter '" & driveLetter & "' to '" & windowsShareName & "'. Error (" & Err.number & ") : " & Err.description
        exitFatalError(errorMessage)
      End If
    End If
       
  End Function
  
  Public Sub deleteExistingFolder(folderPath)
     
    Dim folder
 
     If INSTALLER.getFSO().folderExists(folderPath) Then
        Set folder = INSTALLER.getFSO().getFolder(folderPath)
        deleteFolder(folder)
     End If

  End Sub

  Private Sub deleteFolderContents(folder)
  
    Dim subFolders, Files, subFolder, file, errorMessage

    Set subFolders = folder.SubFolders
    For each subFolder in subFolders
      deleteFolderContents(subFolder)
      On Error Resume Next
      subFolder.delete(TRUE)
      If Err.number  <> 0 Then
        errorMessage = "deleteFolderContents(): Fatal Error deleting Folder '" & subFolder.path & "'."
        exitFatalError(errorMessage)    	
      End If
      On Error GoTo 0  
    Next

    Set files = folder.files
    For each file in files
      On Error Resume Next
      file.delete(TRUE)
      If Err.number  <> 0 Then
        errorMessage = "deleteFolderContents(): Fatal Error deleting File '" & file.path & "'."
        exitFatalError(errorMessage)    	
      End If
      On Error GoTo 0  
    Next

  End Sub

  Private Sub deleteFolder(folder)
   
    Dim errorMessage

    On Error Resume Next
    folder.delete(TRUE)
    If Err.number  <> 0 Then
      errorMessage = "deleteFolder(): Fatal Error deleting Folder '" & folder.path & "'."
      exitFatalError(errorMessage)    	
    End If
    On Error GoTo 0  
        
  End sub
  
  Public Function createFolder(sourceFolderName)

    Dim errorMessage

    On Error Resume Next
    Set CreateFolder = INSTALLER.getFSO().createFolder(sourceFolderName)
    
    If Err.number = 70 Then
    	MsgBox "Unable to create folder """  & sourceFolderName & """. Please close any applications or windows using this folder, then click 'OK' to retry.",vbCritical
      Set CreateFolder = INSTALLER.getFSO().createFolder(sourceFolderName)
    End If

    If Err.number  <> 0 Then
      errorMessage = "CreateFolder(): Fatal Error creating Folder '" & sourceFolderName & "'."
      exitFatalError(errorMessage)
    End If

  End Function

  Public Sub createEmptyFolder(folderPath)

    Dim emptyFolder

    ' Workaround for Error 70 Permission Denied Error when recreating recently deleted Folder in Windows 7

  	If INSTALLER.getFSO().FolderExists(folderPath) Then
   		Set emptyFolder = INSTALLER.getFSO.getFolder(folderPath)
  		deleteFolderContents(emptyFolder)
    Else
      Set emptyFolder = createFolder(folderPath)
    End If

  End Sub   
  
  Public Sub makeFolder(folderPath)

    ' Create the specified folder tree if it does not already exist.
   
    If Not INSTALLER.getFSO().FolderExists(folderPath) Then
      makeFolder(INSTALLER.getFSO().GetParentFolderName(folderPath))
      INSTALLER.getFSO().createFolder(folderPath)
    End If

  End Sub   

  Public Sub cloneFolder(installParameters, sourceFolderName,targetFolderName)
   
    Dim sourceFolder, targetFolder, errorMessage
  
		If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then	
      On Error Resume Next
      Set sourceFolder = INSTALLER.getFSO().getFolder(sourceFolderName)
      If Err.number  <> 0 Then
    	  errorMessage = "cloneFolder(): Fatal Error encountered creatng folder '" & sourceFolderName & "'."
        exitFatalError(errorMessage)
      End If
      Set targetFolder = INSTALLER.getFSO().getFolder(targetFolderName)
      cloneSubFolder installParameters, sourceFolder, targetFolder
    Else
    	SCRIPT_GENERATOR.cloneFolder installParameters, sourceFolderName,targetFolderName
    End If

  End Sub
   

  Public Sub CopyFile(installParameters, sourceFile,targetFile)
    INSTALLER.getFSO().copyFile sourceFile,targetFile
  End Sub 

  Public Sub copyFolder(installParameters, sourceFolderName,targetFolderName)
    INSTALLER.getFSO().copyFolder sourceFolderName, targetFolderName
  End Sub

  Private Sub cloneSubFolder(installParameters, sourceFolder, targetFolder)

    Dim childFolderList, childFolder, cloneTarget, targetFolderPath, fileList, file, targetFilePath

    Set childFolderList = sourceFolder.SubFolders
    For each childFolder in childFolderList
      targetFolderPath = targetFolder.path & FILE_SEPERATOR & childFolder.name
      If (INSTALLER.getFSO().folderExists(targetFolderPath)) Then
      	Set cloneTarget = INSTALLER.getFSO().getFolder(targetFolderPath)
      Else
        Set cloneTarget = INSTALLER.getFSO().createFolder(targetFolderPath)
      End If
      cloneSubFolder installParameters, childFolder, cloneTarget
    Next
        
    Set fileList = sourceFolder.files
    for each file in fileList
      targetFilePath = targetFolder.path & FILE_SEPERATOR & file.name
      cloneFile installParameters, file.path, targetFilePath
    Next

  End Sub

  Public Sub CloneFile(installParameters, sourceFilePath,targetFilePath)

    Dim inFile, content, outFile

    Set InFile = INSTALLER.getFSO().openTextFile(sourceFilePath)
    content = inFile.readall
    inFile.close

    content = installParameters.replaceMacros(content,false)
  
    Set outFile = INSTALLER.getFSO().createTextFile(targetFilePath,TRUE)
    outfile.writeline content
    outFile.close
  
  End Sub 
  
  Public Sub unzipArchive(source,target)
  
	  Dim shell, fileList
    set shell = CreateObject("Shell.Application")
    set fileList =  shell.NameSpace(source).items 
    shell.NameSpace(target).CopyHere(fileList)
  End Sub

  Public Sub createZipArchive(archivePath)

    Dim zipHeader, zipFile
    
    ' header required to convince Windows shell that this is really a zip file
    zipHeader = Chr(80) & Chr(75) & Chr(5) & Chr(6) & String(18, 0) 
    set zipFile = INSTALLER.getFSO().CreateTextFile(archivePath)
    zipFile.Write zipHeader
    zipFile.Close
    
  End Sub
  
  Public Sub zipArchive(archive,folder)
  
	  Dim shell, fileList
    set shell = CreateObject("Shell.Application")
    set fileList =  shell.NameSpace(folder).items 
    shell.NameSpace(archive).CopyHere fileList

   do until shell.NameSpace(archive).items.count = fileList.count 
     wscript.sleep 1000  
   loop 

  End Sub


  Public Function createTextFile(filename)
     Set createTextFile = INSTALLER.getFSO().createTextFile(filename, True)
  End Function

  Public Function openTextFile(filename)
     Set openTextFile = INSTALLER.getFSO().openTextFile(filename, 8)
  End Function
  
  Sub makeShortcut(INSTALLER, shortcutLocation, shortcutName, targetPath, iconPath, targetDirectory, arguments)

    Dim oShellLink, details
    
    If IsNull(shortcutLocation) Then
      shortcutLocation = INSTALLER.getShortcutFolderPath()
    End If

    If IsNull(targetDirectory) Then
      targetDirectory = INSTALLER.getDemoDirectory()
    End If

    '                                          details = "Create Short Cut : " + vbCRLF 
    '                                details = details & "  Location  : """ + shortcutLocation & """" + vbCRLF
    '                                details = details & "  Name      : """ + shortcutName & """" + vbCRLF
    '                                details = details & "  Directory : """ + targetDirectory & """" + vbCRLF
    ' If Not isNULL(targetPath) Then details = details & "  Target    : """ + targetPath & """" + vbCRLF
    ' If Not isNULL(iconPath)   Then details = details & "  Icon      : """ + iconPath & """" + vbCRLF
    ' If Not isNULL(arguments)  Then details = details & "  Arguments : """ + arguments & """" + vbCRLF

    ' MSGBOX details,vbCritical

    Set oShellLink = INSTALLER.getWShell().CreateShortcut(shortcutLocation & FILE_SEPERATOR & shortcutName & ".lnk")

    oShellLink.WorkingDirectory = targetDirectory
    oShellLink.Description = ""
    oShellLink.WindowStyle = 1

    If Not isNULL(targetPath) and (targetPath <> "") Then
      oShellLink.targetPath = targetPath
    End If

    If Not isNULL(iconPath) and (iconPath <> "") Then
      oShellLink.IconLocation = iconPath
    End If
  
    If Not isNULL(arguments) and (arguments <> "") Then
      oShellLink.Arguments = arguments
    End If

    oShellLink.Save

  End Sub
     
  function createJunctionPoint(location, name, target)
  
    DIM targetFolderPath, folder, desktop, link, currentOperation
       
    currentOperation = "  CREATE JUNCTION : Location => '" & location & "', Name => '" & name & "', Target => '" & target & "'."
    writeLogMessage currentOperation
 
    targetFolderPath = location & FILE_SEPERATOR & name
    
    Set folder = INSTALLER.getFSO().createFolder(targetFolderPath)

    Set desktop = INSTALLER.getFSO().createTextFile(targetFolderPath & "\desktop.ini", true)
    desktop.writeLine("[.ShellClassInfo]")
    desktop.writeLine("CLSID2={0AFACED1-E828-11D1-9187-B532F1E9575D}")
    desktop.close
 
    Set desktop = INSTALLER.getFSO().getFile(targetFolderPath & "\desktop.ini")
    desktop.attributes = 7
    folder.attributes = 4
    
     
    Set link = INSTALLER.getWShell().CreateShortcut(targetFolderPath & "\target.lnk")
    link.TargetPath = target
    link.WorkingDirectory = targetFolderPath
    link.IconLocation = "%SystemRoot%\system32\imageres.dll ,3"
    link.save
  
  End Function

  Sub makeHttpShortcut(shortcutLocation, shortcutName, target, iconPath, arguments)

     Dim urlLink
  
     If IsNull(shortcutLocation) Then
       shortCutFolderPath = INSTALLER.getDesktopFolderPath()
     End If


     Set urlLink = INSTALLER.getWShell().CreateShortcut( shortcutLocation & FILE_SEPERATOR & shortCutName & ".url")

  
     If Not IsNull(arguments) Then
     	target = target & "?" & arguments
     End If

     If Not IsNull(iconPath) Then
       urlLink.IconLocation = iconPath
     End If

     urlLink.targetPath = target
     urlLink.Save

  End Sub

  Public Function makeFavoritesFolder(folderName)

    Dim favorites, linkFolderPath, linkFolder

    favorites = INSTALLER.getWShell().SpecialFolders("Favorites")
    linkFolderPath = favorites & FILE_SEPERATOR & folderName
    
    createEmptyFolder(linkFolderPath)
    makeFavoritesFolder = linkFolderPath

  End Function
         
End Class

Class repositoryControl

  Private httpTrace
  Private errorDetails
  Private XHR

  Private useFtpProtocol
  Private ftpUploadScript

  Private     folderStatusList 
  Private     XMLHTTPRequestID 
  
        
  Private Sub Class_Initialize()
  
    XMLHTTPRequestID = "Msxml2.XMLHTTP.6.0"
    ' XMLHTTPRequestID = "Microsoft.XmlHttp"
    Set XHR = CreateObject(XMLHTTPRequestID)
    Set folderStatusList = Nothing

    httpTrace = INSTALLER.doHTTPTrace()
    useFtpProtocol = INSTALLER.useFtpProtocol()

  End Sub   
  
  Public Function getXHR
  
    set getXHR = XHR
   
  End Function
  
  Public Function uploadFile (local, remote, mode, user, password)
      
    Dim returnCode, rc, errorMessage

    If (INSTALLER.getFSO().FileExists(local)) Then

      returnCode = doHead(remote, user, password)
    
      If (returnCode = 200) Then

        If mode = "ERROR" Then
          errorMessage = "UploadFile() [FORCE]: Target '" & INSTALLER.getServerURL() & remote & "' already exists"
          exitFatalError(errorMessage)
        End If
      
        If mode = "SKIP" Then
          uploadFile = returnCode
          Exit Function
        End If
      
        If mode = "FORCE" Then
          rc = doDelete(remote, user, password)
          If ((rc <> 200) and (rc <> 202) and (rc <> 204)) Then
          	errorMessage = "UploadFile() [FORCE] : Delete of existing Resource Failed. HTTP Status " & rc & ". Unable to upload '" & local & "' into '" & INSTALLER.getServerURL() & remote & "'."
            exitFatalError(errorMessage)
          End If
        End If
   
      End If

      returnCode = doPut (local, remote, null, user, password)
      uploadFile = returnCode
     
      If (returnCode <> 201) Then
        errorMessage = "UploadFile(): Upload operation failed (HTTP Status (" & returnCode & "). Unable to upload '" & local & "' into '" & INSTALLER.getServerURL() & remote & "'."
        exitFatalError(errorMessage)
      End If

   Else
   	 MsgBox "UploadFile(): Skipping missing source file '" & local & "'.",vbCritical
   	 writeLogMessage "UploadFile(): Skipping missing source file '" & local & "'."
     uploadFile = -1
   End If
        
  End Function
    
  Public Function uploadContent (content, remote, mode, user, password)
    
    Dim returnCode, rc, errorMessage

    returnCode = doHead(remote, user, password)
    
    If (returnCode = 200) Then

      If mode = "ERROR" Then
        errorMessage = "uploadContent() [ERROR]: Target '" & INSTALLER.getServerURL() & remote & "' already exists"
        exitFatalError(errorMessage)
      End If
      
      If mode = "SKIP" Then
        uploadFile = returnCode
        Exit Function
      End If
      
      If mode = "FORCE" Then
        rc = doDelete(remote, user, password)
        If ((rc <> 200) and (rc <> 202) and (rc <> 204)) Then
        	errorMessage = "uploadContent() [FORCE]: Delete of existing Resource Failed. HTTP Status " & rc & ". Unable to upload '" & local & "' into '" & INSTALLER.getServerURL() & remote & "'."
          exitFatalError(errorMessage)
        End If
      End If

    End If   
    
    returnCode = doPutContent (content, remote, null, user, password)
    uploadContent = returnCode

    If (returnCode <> 201) Then
      errorMessage = "uploadContent(): Upload operation failed (HTTP Status (" & returnCode & "). Unable to upload '" & local & "' into '" & INSTALLER.getServerURL() & remote & "'."
      exitFatalError(errorMessage)
    End If
            
  End Function
  
  Public Sub makeWebFolder(shortCutName, targetURL, shortcutLocation)
    doMakeWebFolder shortCutName, targetURL, shortcutLocation, INSTALLER.getUsername(), INSTALLER.getPassword()
  End Sub

  Public Sub doMakeWebFolder(shortCutName, targetURL, shortcutLocation, user, password)

    Dim commandLine, returnCode, errorMessage
    
    Set folderStatusList = CreateObject("Scripting.Dictionary")
    
    returnCode = MakeDir(targetURL,true,user,password)
    
    If returnCode = 201 or returnCode = 200 Then

      ' WebFolderLink.exe /TARGET "http://localhost:8080/" /LINK "C:\TEMP\test"
      
      targetURL = makeWebFolderLinkURL(user,password) + targetURL
      commandLine = """" + INSTALLER.getInstallFolderPath() + FILE_SEPERATOR + "WebFolderLink.exe"" /TARGET """ + targetURL + """ /LINK """ + shortcutLocation + FILE_SEPERATOR + ShortCutName + """"    
      returnCode = INSTALLER.getWShell().run (commandLine,7,true)
    Else
      errorMessage =  "MakeWebFolder(): Installation Failed. Unable to access Web Folder '" & targetURL & "'."
      exitFatalError(errorMessage)
    End If
    
    Set folderStatusList = Nothing
      
  End Sub

  Private Function makeWebFolderLinkURL(user,password)
    makeWebFolderLinkURL = "http://" & user & ":" & password & "@" & INSTALLER.getHostName() & ":" & INSTALLER.getHttpPort()
    ' makeWebFolderLinkURL = "http://" & user & ":" & password & "@" & INSTALLER.getHostName() & ":" & INSTALLER.getHttpPort()
  End Function

  
  Public Function makeDir(targetFolder,force,user,password)

    Dim Status, ParentFolder, errorMessage

    status = doHead(targetFolder, user, password)
    
    If Not (folderStatusList Is Nothing) Then
      folderStatusList.add targetFolder, status
    End If

    if (status = 404) Then
    	if force Then
        parentFolder = Mid(targetFolder,1,InStrRev(targetFolder,"/")-1)
        makeDir parentFolder,true, user, password
      end if		
      status = doMKCOL(targetFolder, user, password)
    end if
     
    makeDir = status    
        
  End Function

  Function checkXHRStatus(method, user, remote, attempts)
  
    '/*
    '**
    '** Code        Error Message and Description
    '** -----       -----------------------------
    '** 12001       ERROR_INTERNET_OUT_OF_HANDLES
    '**             No more handles could be generated at this time.
    '** 
    '** 12002       ERROR_INTERNET_TIMEOUT
    '**             The request has timed out.
    '** 
    '** 12003       ERROR_INTERNET_EXTENDED_ERROR
    '**             An extended error was returned from the server. This is
    '**             typically a string or buffer containing a verbose error
    '**             message. Call InternetGetLastResponseInfo to retrieve the
    '**             error text.
    '** 
    '** 12004       ERROR_INTERNET_INTERNAL_ERROR
    '**             An internal error has occurred.
    '** 
    '** 12005       ERROR_INTERNET_INVALID_URL
    '**             The URL is invalid.
    '** 
    '** 12006       ERROR_INTERNET_UNRECOGNIZED_SCHEME
    '**             The URL scheme could not be recognized or is not supported.
    '** 
    '** 12007       ERROR_INTERNET_NAME_NOT_RESOLVED
    '**             The server name could not be resolved.
    '** 
    '** 12008       ERROR_INTERNET_PROTOCOL_NOT_FOUND
    '**             The requested protocol could not be located.
    '** 
    '** 12009       ERROR_INTERNET_INVALID_OPTION
    '**             A request to InternetQueryOption or InternetSetOption
    '**             specified an invalid option value.
    '** 
    '** 12010       ERROR_INTERNET_BAD_OPTION_LENGTH
    '**             The length of an option supplied to InternetQueryOption or
    '**             InternetSetOption is incorrect for the type of option
    '**             specified.
    '** 
    '** 12011       ERROR_INTERNET_OPTION_NOT_SETTABLE
    '**             The request option cannot be set, only queried.
    '** 
    '** 12012       ERROR_INTERNET_SHUTDOWN
    '**             The Win32 Internet function support is being shut down or
    '**             unloaded.
    '** 
    '** 12013       ERROR_INTERNET_INCORRECT_USER_NAME
    '**             The request to connect and log on to an FTP server could
    '**             not be completed because the supplied user name is
    '**             incorrect.
    '** 
    '** 12014       ERROR_INTERNET_INCORRECT_PASSWORD
    '**             The request to connect and log on to an FTP server could
    '**             not be completed because the supplied password is
    '**             incorrect.
    '** 
    '** 12015       ERROR_INTERNET_LOGIN_FAILURE
    '**             The request to connect to and log on to an FTP server
    '**             failed.
    '** 
    '** 12016       ERROR_INTERNET_INVALID_OPERATION
    '**             The requested operation is invalid.
    '** 
    '** 12017       ERROR_INTERNET_OPERATION_CANCELLED
    '**             The operation was canceled, usually because the handle on
    '**             which the request was operating was closed before the
    '**             operation completed.
    '** 
    '** 12018       ERROR_INTERNET_INCORRECT_HANDLE_TYPE
    '**             The type of handle supplied is incorrect for this
    '**             operation.
    '** 
    '** 12019       ERROR_INTERNET_INCORRECT_HANDLE_STATE
    '**             The requested operation cannot be carried out because the
    '**             handle supplied is not in the correct state.
    '** 
    '** 12020       ERROR_INTERNET_NOT_PROXY_REQUEST
    '**             The request cannot be made via a proxy.
    '** 
    '** 12021       ERROR_INTERNET_REGISTRY_VALUE_NOT_FOUND
    '**             A required registry value could not be located.
    '** 
    '** 12022       ERROR_INTERNET_BAD_REGISTRY_PARAMETER
    '**             A required registry value was located but is an incorrect
    '**             type or has an invalid value.
    '** 
    '** 12023       ERROR_INTERNET_NO_DIRECT_ACCESS
    '**             Direct network access cannot be made at this time.
    '** 
    '** 12024       ERROR_INTERNET_NO_CONTEXT
    '**             An asynchronous request could not be made because a zero
    '**             context value was supplied.
    '** 
    '** 12025       ERROR_INTERNET_NO_CALLBACK
    '**             An asynchronous request could not be made because a
    '**             callback function has not been set.
    '** 
    '** 12026       ERROR_INTERNET_REQUEST_PENDING
    '**             The required operation could not be completed because one
    '**             or more requests are pending.
    '** 
    '** 12027       ERROR_INTERNET_INCORRECT_FORMAT
    '**             The format of the request is invalid.
    '** 
    '** 12028       ERROR_INTERNET_ITEM_NOT_FOUND
    '**             The requested item could not be located.
    '** 
    '** 12029       ERROR_INTERNET_CANNOT_CONNECT
    '**             The attempt to connect to the server failed.
    '** 
    '** 12030       ERROR_INTERNET_CONNECTION_ABORTED
    '**             The connection with the server has been terminated.
    '** 
    '** 12031       ERROR_INTERNET_CONNECTION_RESET
    '**             The connection with the server has been reset.
    '** 
    '** 12032       ERROR_INTERNET_FORCE_RETRY
    '**             Calls for the Win32 Internet function to redo the request.
    '** 
    '** 12033       ERROR_INTERNET_INVALID_PROXY_REQUEST
    '**             The request to the proxy was invalid.
    '** 
    '** 12036       ERROR_INTERNET_HANDLE_EXISTS
    '**             The request failed because the handle already exists.
    '** 
    '** 12037       ERROR_INTERNET_SEC_CERT_DATE_INVALID
    '**             SSL certificate date that was received from the server is
    '**             bad. The certificate is expired.
    '** 
    '** 12038       ERROR_INTERNET_SEC_CERT_CN_INVALID
    '**             SSL certificate common name (host name field) is incorrect.
    '**             For example, if you entered www.server.com and the common
    '**             name on the certificate says www.different.com.
    '** 
    '** 12039       ERROR_INTERNET_HTTP_TO_HTTPS_ON_REDIR
    '**             The application is moving from a non-SSL to an SSL
    '**             connection because of a redirect.
    '** 
    '** 12040       ERROR_INTERNET_HTTPS_TO_HTTP_ON_REDIR
    '**             The application is moving from an SSL to an non-SSL
    '**             connection because of a redirect.
    '** 
    '** 12041       ERROR_INTERNET_MIXED_SECURITY
    '**             Indicates that the content is not entirely secure. Some of
    '**             the content being viewed may have come from unsecured
    '**             servers.
    '** 
    '** 12042       ERROR_INTERNET_CHG_POST_IS_NON_SECURE
    '**             The application is posting and attempting to change
    '**             multiple lines of text on a server that is not secure.
    '** 
    '** 12043       ERROR_INTERNET_POST_IS_NON_SECURE
    '**             The application is posting data to a server that is not
    '**             secure.
    '** 
    '** 12110       ERROR_FTP_TRANSFER_IN_PROGRESS
    '**             The requested operation cannot be made on the FTP session
    '**             handle because an operation is already in progress.
    '** 
    '** 12111       ERROR_FTP_DROPPED
    '**             The FTP operation was not completed because the session was
    '**             aborted.
    '** 
    '** 12130       ERROR_GOPHER_PROTOCOL_ERROR
    '**             An error was detected while parsing data returned from the
    '**             gopher server.
    '** 
    '** 12131       ERROR_GOPHER_NOT_FILE
    '**             The request must be made for a file locator.
    '** 
    '** 12132       ERROR_GOPHER_DATA_ERROR
    '**             An error was detected while receiving data from the gopher
    '**             server.
    '** 
    '** 12133       ERROR_GOPHER_END_OF_DATA
    '**             The end of the data has been reached.
    '** 
    '** 12134       ERROR_GOPHER_INVALID_LOCATOR
    '**             The supplied locator is not valid.
    '** 
    '** 12135       ERROR_GOPHER_INCORRECT_LOCATOR_TYPE
    '**             The type of the locator is not correct for this operation.
    '** 
    '** 12136       ERROR_GOPHER_NOT_GOPHER_PLUS
    '**             The requested operation can only be made against a Gopher+
    '**             server or with a locator that specifies a Gopher+
    '**             operation.
    '** 
    '** 12137       ERROR_GOPHER_ATTRIBUTE_NOT_FOUND
    '**             The requested attribute could not be located.
    '** 
    '** 12138       ERROR_GOPHER_UNKNOWN_LOCATOR
    '**             The locator type is unknown.
    '** 
    '** 12150       ERROR_HTTP_HEADER_NOT_FOUND
    '**             The requested header could not be located.
    '** 
    '** 12151       ERROR_HTTP_DOWNLEVEL_SERVER
    '**             The server did not return any headers.
    '** 
    '** 12152       ERROR_HTTP_INVALID_SERVER_RESPONSE
    '**             The server response could not be parsed.
    '** 
    '** 12153       ERROR_HTTP_INVALID_HEADER
    '**             The supplied header is invalid.
    '** 
    '** 12154       ERROR_HTTP_INVALID_QUERY_REQUEST
    '**             The request made to HttpQueryInfo is invalid.
    '** 
    '** 12155       ERROR_HTTP_HEADER_ALREADY_EXISTS
    '**             The header could not be added because it already exists.
    '** 
    '** 12156       ERROR_HTTP_REDIRECT_FAILED
    '**             The redirection failed because either the scheme changed
    '**             (for example, HTTP to FTP) or all attempts made to redirect
    '**             failed (default is five attempts).
    '** 
    '*/  
    
    Dim errorMessage
    
    If (httpTrace) Then
      writeLogMessage method & "(): HTTP Status " & XHR.status & " [" & XHR.statusText & "]."
    End If
    
    checkXHRStatus = XHR.status

    ' If (XHR.status <> 200) Then
    
      If (XHR.status = 401) Then
      	errorMessage = method & "(): " & XHR.statusText & ". User '" & user & "' on resource '" & INSTALLER.getServerURL() & remote & "'."
        exitFatalError(errorMessage)
      End If
    
      If (XHR.status = 500) Then
 	      errorMessage = method & "(): " & XHR.statusText & ". User '" & user & "' on resource '" & INSTALLER.getServerURL() & remote & "'."
        exitFatalError(errorMessage)
      End If
    
  	  If ((XHR.status > 599) and (attempts < 4 )) Then
	    	if ((Not httpTrace) and (attempts = 1)) Then
          writeLogMessage method & "(): Target = '" & INSTALLER.getServerURL() & remote & "'. User = '" & user & "'. Password = '" & "********" & "'."
        End If
        writeLogMessage method & "(): Attempt [" & attempts & "]. Unexpected HTTP Status Code: '" & XHR.status & "' (" & XHR.statusText & ")."
        If (Err.Number <> 0) Then
          writeLogMessage method & "(): Error: '" & hex(Err.Number) & "' (" & Err.Description & ")."
        End If
        Set XHR = CreateObject(XMLHTTPRequestID)
	  	  Err.Clear
      End If
    
      If (Err.number <> 0) Then
        errorMessage = method &"(): Unrecoverable Error: [" & hex(Err.Number) & "] (" & Err.description & "). Target = '" & INSTALLER.getServerURL() & remote & "'. HTTP Status Code '" & XHR.status  &  "'"
        If (XHR.statusText <> "") Then
        	errorMessage = errorMessage & " (" & XHR.statusText & ")."
        Else 
        	If (XHR.status = 12109) Then
        	  errorMessage = errorMessage & " (" & "ERROR_INTERNET_CANNOT_CONNECT: The attempt to connect to the server failed." & ")."
          End If
      	  If (XHR.status = 12031) Then
        	  errorMessage = errorMessage & " (" & "ERROR_INTERNET_CONNECTION_RESET: The connection with the server has been reset." & ")."
          End If
        End If
        exitFatalError(errorMessage)
      End If

    ' End If
    
  end Function

  Public Function doHEAD(remote,user,password)
   
    Dim errorMessage, attempts, xhrStatus
    
    If (httpTrace) Then
      writeLogMessage "doHEAD(): Target = '" & INSTALLER.getServerURL() & remote & "'. User = '" & user & "'. Password = '" & password & "'."
    End If
    
    attempts = 0
    On Error Resume Next
    Do
    	attempts = attempts + 1
      XHR.Open "HEAD", INSTALLER.getServerURL() & remote, false, user, password
      XHR.send ("")
      xhrStatus = checkXHRStatus("doHEAD", user, remote, attempts)
    Loop Until (xhrStatus < 600)

    On Error GoTo 0  
    doHead = XHR.status

  End Function
  
  Public Function doGET(remote,user,password)
   
    Dim errorMessage, attempts, xhrStatus
    
    If (httpTrace) Then
      writeLogMessage "doGET(): Target = '" & INSTALLER.getServerURL() & remote & "'. User = '" & user & "'. Password = '" & password & "'."
    End If
    
    attempts = 0
    On Error Resume Next
    Do
    	attempts = attempts + 1
      XHR.Open "GET", INSTALLER.getServerURL() & remote, false, user, password
      XHR.send ("")
      xhrStatus = checkXHRStatus("doGET", user, remote, attempts)
    Loop Until (xhrStatus < 600)

    On Error GoTo 0  
    doGET = XHR.status

  End Function

  Public Function doPUT(local,remote,contentType,user,password)

    DIM status

    If useFtpProtocol Then
    	status = ftpPUT(local,remote,contentType,user,password)
    Else
    	status = httpPUT(local,remote,contentType,user,password)
    End If

    doPUT = status
     
  End Function

  Public Function ftpPUT(local,remote,contentType,user,password)

    ftpUploadScript = ftpUploadScript & "user " & user & " " & password & vbCRLF
    ftpUploadScript = ftpUploadScript & "bin" & vbCRLF
    ftpUploadScript = ftpUploadScript & "put """ & local & """ """ & remote & """" & vbCRLF
    ftpPUT = 201

  End Function

  Public Function httpPUT(local,remote,contentType,user,password)

    DIM ado_stream, errorMessage, attempts, xhrStatus
     
    If (httpTrace) Then
      writeLogMessage "httpPUT(): Target = '" & INSTALLER.getServerURL() & remote & "'. User = '" & user & "'. Password = '" & password & "'. Local = '" & local & "'."
    End If
        
    Set ado_stream = CreateObject("ADODB.Stream")
    ado_stream.Type = 1
    ado_stream.Open()
    ado_stream.LoadFromFile(local)
      
    If Err.number  <> 0 Then
     	errorMessage = "httpPUT() - Fatal Error encountered reading local File '" & local & "'." 
      exitFatalError(errorMessage)
    End If
  
    attempts = 0
    On Error Resume Next
    Do
    	attempts = attempts + 1
      XHR.Open "PUT", INSTALLER.getServerURL() & remote, false, user, password     
      If Not IsNull(contentType) Then
        XHR.setRequestHeader "Content-type", contentType
      End If
      XHR.send(ado_stream.Read(-1))
      xhrStatus = checkXHRStatus("httpPUT", user, remote,attempts)
    Loop Until (xhrStatus < 600)

    ado_stream.Close()

    If XHR.status <> 201 Then
      writeLogMessage = "httpPUT (" & INSTALLER.getServerURL() & remote & ") : HTTP Status = " & XHR.status & " (" & XHR.statusText & ")."
    End If
   
    On Error GoTo 0  
    httpPUT = XHR.status

  End Function

  Public Function doPUTContent(content,remote,contentType,user,password)

    If useFtpProtocol Then
    	doPUTContent = ftpPUTContent(content,remote,contentType,user,password)
    Else
    	doPUTContent = httpPUTContent(content,remote,contentType,user,password)
    End If

  End Function

  Public Function ftpPUTContent(content,remote,contentType,user,password)

    ' Write content to local file system using unique file name then upload to use remote.
    
    ftpUploadScript = ftpUploadScript & "#Unimplemented" & vbCRLF
    ftpUploadScript = ftpUploadScript & "user " & user & " " & password & vbCRLF
    ftpUploadScript = ftpUploadScript & "put """ & local & """ """ & remote & """" & vbCRLF
    ftpPUT = 201

  End Function

  Public Function httpPUTContent(content,remote,contentType,user,password)

    DIM errorMessage, attempts, xhrStatus
     
    If (httpTrace) Then
      writeLogMessage "httpPUTContent(): Target = '" & INSTALLER.getServerURL() & remote & "'. User = '" & user & "'. Password = '" & password & "'."
    End If
         
    attempts = 0
    On Error Resume Next
    Do
      attempts = attempts + 1
      XHR.Open "PUT", INSTALLER.getServerURL() & remote, false, user, password
      If Not IsNull(contentType) Then
        XHR.setRequestHeader "Content-type", contentType
      End If
      XHR.send(content)
      xhrStatus = checkXHRStatus("httpPUTContent", user, remote, attempts)
    Loop Until (xhrStatus < 600)

    If XHR.status <> 201 Then
      writeLogMessage = "httpPUTContent (" & INSTALLER.getServerURL() & remote & ") : HTTP Status = " & XHR.status & " (" & XHR.statusText & ")."
    End If

    On Error GoTo 0  
    httpPUTContent = XHR.status

  End Function

  Public Function doMKCOL(remote,user,password)
 
    If useFtpProtocol Then
    	doMKCOL = ftpMKCOL(remote,user,password) 
    Else
    	doMKCOL = httpMKCOL(remote,user,password)
    End If
    
  End Function
 
  Public Function ftpMKCOL(remote,user,password)

    If newFolderList.exists(remote) Then
    	ftpMKCOL = 201
    Else  
      newFolderList.item(remote) =  remote
      ftpUploadScript = ftpUploadScript & "user " & user & " " & password & vbCRLF
      ftpUploadScript = ftpUploadScript & "mkdir """ & remote & """" & vbCRLF
      ftpMKCOL = 201
    End If
  
  End Function
    
  Public Function httpMKCOL(remote,user,password)

    Dim errorMessage, attempts, xhrStatus

    If (httpTrace) Then
      writeLogMessage "httpMKCOL(): target = '" &  INSTALLER.getServerURL() & remote & "'. User = '" & user & "'. Password = '" & password & "'"
    End If
  
    attempts = 0     
    On Error Resume Next
    Do
    	attempts = attempts + 1
	    XHR.Open "MKCOL", INSTALLER.getServerURL() & remote, false, user, password
      XHR.send("")            
      xhrStatus = checkXHRStatus("httpMKCOL", user, remote, attemtps)
    Loop Until (xhrStatus < 600)
  
    If XHR.status <> 201 Then
      writeLogMessage "httpMKCOL (" & INSTALLER.getServerURL() & remote & ") : HTTP Status=" & XHR.status & "."
    End If
  
    On Error GoTo 0  
    httpMKCOL = XHR.status
  
  End Function
 
  Public Function doDELETE(remote,user,password)

    ' Cannot defer delete, Prevents MKCOL and other operations from returning incorrect results.
    
    'If useFtpProtocol Then
    '	doDELETE = ftpDELETE(remote,user,password) 
    'Else
    '	
    'End If

    doDELETE = httpDELETE(remote,user,password)
    
  End Function

  Public Function ftpDELETE(remote,user,password)
  
    ftpUploadScript = ftpUploadScript & "user " & user & " " & password & vbCRLF
    ftpUploadScript = ftpUploadScript & "del """ & remote & """" & vbCRLF
    ftpDELETE = 201
  
  End Function
  
  Public Function httpDELETE(remote,user,password)

    Dim errorMessage, attempts, xhrStatus
    
    If (httpTrace) Then
      writeLogMessage "httpDELETE(): target = '" &  INSTALLER.getServerURL() & remote & "'. User = '" & user & "'. Password = '" & password & "'"
    End If
    
    attempts = 0
    On Error Resume Next
    Do
    	attempts = attempts + 1
      XHR.Open "DELETE", INSTALLER.getServerURL() & remote, false, user, password
      XHR.send("")
      xhrStatus = checkXHRStatus("httpDELETE", user, remote, attempts)
    Loop Until (xhrStatus < 600)

    If ((XHR.status <> 201)  and (XHR.status <> 204) and (XHR.status <> 207) and (XHR.status <> 404)) Then
      writeLogMessage "httpDELETE(): '" & INSTALLER.getServerURL() & remote & "'. Status=" & XHR.status  &  " (" & XHR.statusText + ")."
    End If
    
    On Error GoTo 0  
    httpDELETE = XHR.status
  
  End Function
  
  Public Function runFtpScript
     ftpUploadScript = "open " & INSTALLER.getHostname() & " " & INSTALLER.getFtpPort() & vbCRLF & ftpUploadScript
     ftpUploadScript = ftpUploadScript & "quit" & vbCRLF 
     runFtpScript = FTP.executeScript(ftpUploadScript)
  End Function
  
End Class

Class sqlPlusControl
    
  ' Test connection to the database
  
  Public Function getHttpPort(user, password)
    Dim returnCode
    returnCode = executeSQLPLUS(user, password, "", "sql/getHttpPort.sql")
    getHttpPort = returnCode
  End Function

  Public Function getFtpPort(user, password)
    Dim returnCode
    returnCode = executeSQLPLUS(user, password, "", "sql/getFtpPort.sql")
    getFtpPort = returnCode
  End Function

  Public Function testConnection(user, password, role)
    Dim returnCode
    returnCode = executeSQLPLUS(user, password, role, "sql/verifyConnection.sql")
    If returnCode = 2 Then
    	testConnection = true
    Else
    	testConnection = false
    End If
  End Function
  
  ' Execute SQL Script as specIfied user

  Public Function execute(username, password, sqlScript)
    execute = executeSQLPLUS(username, password, "", sqlScript)
  End Function

  Public Function sysdba(user, password, sqlScript)
    sysdba = executeSQLPLUS(user, password, " as sysdba", sqlScript)
  End Function
      
  Private Function executeSQLPLUS(user, password, role, sqlScript)
    
     Dim commandLine
     commandLine = INSTALLER.getSQLPlusPath() & " -L " & user & "/" & password & "@" & INSTALLER.getTNSAlias() & role & " @" & sqlScript
     executeSQLPLUS = runCommand(commandLine)
     
  End Function

  Private Function runCommand(commandLine)
 
    Dim returnCode

    On Error Resume Next
    returnCode = INSTALLER.getWShell().Run (commandLine, 7, true)
    If Err.number  <> 0 Then
    	errorMessage = "runCommand(): Fatal Error encountered loading program '" & commandLine & "'."
      exitFatalError(errorMessage)
    End If

    runCommand = returnCode

    ' Set oExec = INSTALLER.getWShell().Exec(CommandString)
    ' Do While oExec.Status = 0
          ' writeLogMessage "Waiting 10 Seconds while SQLPLUS execution completes"
    '    WScript.Sleep 1000
    ' Loop
    ' writeLogMessage "SQLPLUS execution completed"

    ' sqlPlusOutput = oExec.StdOut.ReadAll
    ' writeLogMessage sqlplusOutput
   
  End Function

End Class

Class ftpControl
    
  Public Function executeScript(script)
     
     Dim ftpScript, scriptFileName, scriptFilePath, logFilePath

     scriptFileName = "FileUpload" & TIMER 
     scriptFilePath = INSTALLER.getInstallFolderPath() & FILE_SEPERATOR & scriptFileName & ".ftp"
     logFilePath    = INSTALLER.getInstallFolderPath() & FILE_SEPERATOR & scriptFileName & ".log"
     
     Set ftpScript = INSTALLER.getFSO().createTextFile(scriptFilePath,true)
     ftpScript.write(script)
     ftpScript.close()
     
     execute scriptFilePath, logFilePath
     executeScript = scriptFilePath
     
  End Function
      
  Public Function execute(scriptFile, logFile)
   
     Dim commandLine
     commandLine = "CMD /C FTP -i -n -s:" & scriptFile & " >" & logFile
     writeLogMessage "  " & commandLine
     execute = runCommand(commandLine)
     writeLogMessage "  Status = " & execute
     
  End Function

  Private Function runCommand(commandLine)
 
    Dim returnCode

    On Error Resume Next
    returnCode = INSTALLER.getWShell().Run (commandLine, 7, true)
    If Err.number  <> 0 Then
    	errorMessage = "runCommand(): Fatal Error encountered loading program '" & commandLine & "'."
      exitFatalError(errorMessage)
    End If

    runCommand = returnCode
   
  End Function
  
End Class


Class sqlldrControl
    
  ' Execute SQLLDR as specIfied user
      
  Public Function execute(user, password, controlFile)
    
     Dim commandLine
     If (INSTALLER.isInteractiveInstall() or NOT (MINSTALLER Is Nothing)) Then
       commandLine = INSTALLER.getSQLLDRPath() & " -Userid=" & user & "/" & password & "@" & INSTALLER.getTNSAlias() & " control=" & controlFile
       writeLogMessage commandLine
       execute = runCommand(commandLine)
     Else
     	 execute = SCRIPT_GENERATOR.sqlldr(user,password,replace(controlFile,"\","/"))
     End If
     
  End Function

  Private Function runCommand(commandLine)
 
    Dim returnCode

    On Error Resume Next
    returnCode = INSTALLER.getWShell().Run (commandLine, 7, true)
    If Err.number  <> 0 Then
    	errorMessage = "runCommand(): Fatal Error encountered loading program '" & commandLine & "'."
      exitFatalError(errorMessage)
    End If

    runCommand = returnCode
   
  End Function
  
End Class

Class XMLHELPER
    
  Public Function getOptionalTextNode(ParentNode, childname)
     getOptionalTextNode = getDefaultTextNode(ParentNode, childname, null)
  End Function
  
  Public Function getDefaultTextNode(ParentNode,Childname,default)
   
    Dim nl
    
    Set nl = ParentNode.getElementsByTagName(Childname)
    If nl.length = 0 Then
      If IsNull(default) Then
      	getDefaultTextNode = default
      Else
        getDefaultTextNode = INSTALLER.replaceMacros(default,false)
      End If
    Else
      getDefaultTextNode = getTextNode(parentNode,childName)
    End If
  End Function

  Public Function getTextNode(ParentNode,Childname) 
    getTextNode = INSTALLER.replaceMacros(ParentNode.getElementsByTagName(Childname).item(0).text,false)
  End Function

End Class

CLASS demonstrationConfiguration

  dim DOCUMENT
  dim Configuration

  Private Sub Class_Initialize()
   
    Set DOCUMENT = CreateObject("Msxml2.FreeThreadedDOMDocument.6.0")
    Set Configuration = DOCUMENT.createElement("Configuration")
    DOCUMENT.appendChild(Configuration)
  
  End Sub
  
  Public Sub addDemonstrationRoot
  
    dim element,text
    
    Set element = DOCUMENT.createElement("rootFolder")
    Configuration.appendChild(element)
    Set text = DOCUMENT.createTextnode(INSTALLER.replaceMacros("%DEMOLOCAL%",false))
    element.appendChild(text)

    Set element = DOCUMENT.createElement("commonFolder")
    Configuration.appendChild(element)
    Set text = DOCUMENT.createTextnode(INSTALLER.replaceMacros("%DEMOCOMMON%",false))
    element.appendChild(text)

  End Sub  

  Public sub addHTTPStep(name,link,icon,username,screenshot,windowName) 
  
    dim stepElement, linkElement, element, text
    
    Set stepElement = createStep(name,"HTTP",username)

    If not IsNull(screenshot) Then
      Set element = DOCUMENT.createElement("screenshot")
      stepElement.appendChild(element)
      Set text = DOCUMENT.createTextnode(screenshot)
      element.appendChild(text)
    End If

    Set linkElement = addLinkElement(stepElement, link, icon, "text/html", windowName)
 
  End Sub

  Public sub addSQLStep(name,link,icon,username,rerunnable) 
  
    dim stepElement, linkElement
    Set stepElement = createStep(name,"SQL",username)

    Set linkElement = addLinkElement(stepElement, link, icon, null, null)
    If rerunnable = "true" Then
    	linkElement.setAttribute "rerunnable","true"
    End If
   
  End Sub
  
  Public sub addShellCmdStep(name, username, icon, simulation) 
  
    dim stepElement, element, text
    Set stepElement = createStep(name,"SHELL",username)

    Set element = DOCUMENT.createElement("icon")
    stepElement.appendChild(element)
    Set text = DOCUMENT.createTextnode(icon)
    element.appendChild(text)
    
    If not IsNull(simulation)  Then
    	stepElement.appendChild(stepElement.ownerDocument.importNode(simulation,true))
    End If
    
  End Sub

  Public sub addViewerStep(name,link,icon,username,contentType) 
  
    dim stepElement, linkElement
    Set stepElement = createStep(name,"VIEW",username)
    
    Set linkElement = addLinkElement(stepElement, link, icon, contentType, null)

  End Sub
  
  Public Function addLinkElement(stepElement, link, icon, contentType, windowName) 
  
    Dim linkElement, element, text
  
    Set linkElement = DOCUMENT.createElement("link")
    stepElement.appendChild(linkElement)
    Set text = DOCUMENT.createTextnode(link)
    linkElement.appendChild(text)

    If not IsNull(contentType) Then
      linkElement.setAttribute "contentType", contentType 
    End If
    
    If not IsNull(windowName)  Then
    	linkElement.setAttribute "targetWindow",windowName
    End If

    Set element = DOCUMENT.createElement("icon")
    stepElement.appendChild(element)
    Set text = DOCUMENT.createTextnode(icon)
    element.appendChild(text)
    
    Set addLinkElement = linkElement
    
  end Function

  Public function createStep(name,stepType,username)

    dim stepElement, element, text
     
    Set stepElement = DOCUMENT.createElement("Step")
    Configuration.appendChild(stepElement)

    Set element = DOCUMENT.createElement("name")
    stepElement.appendChild(element)
    Set text = DOCUMENT.createTextnode(name)
    element.appendChild(text)
                
    Set element = DOCUMENT.createElement("stepType")
    stepElement.appendChild(element)
    Set text = DOCUMENT.createTextnode(stepType)
    element.appendChild(text)

    Set element = DOCUMENT.createElement("username")
    stepElement.appendChild(element)
    Set text = DOCUMENT.createTextnode(username)
    element.appendChild(text)
  
    Set createStep = stepElement

  End Function
 
End Class

Class installationManager
 
  Private WSHELL
  Private FSO
  Private interactiveInstall
  Private scriptGenerationMode
  
  Private installationParameters
  Private demonstrationParameters
  Private windowsVersion
  Private sixtyFourBitWindows
  
  Private macroList
  
  Private oracleHome 
  Private oracleHomeName 
  Private oracleHomeKey 
  Private oracleSID 
  
  Private sqlplusPath
  Private sqlldrPath
     
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
  
  Private Sub processOracleHome (OracleHomeList, oracleHome, oracleHomeName, oracleHomeKey, oracleSID)

    dim path1, path2, ohElement, text, keyElement, nameElement, pathElement, sidElement 
    
    path1 = oracleHome & "\bin\sqlplus.exe"
    path2 = oracleHome & "\sqlplus.exe"
    
    If (FSO.fileExists(path1) or FSO.fileExists(path2)) Then
      set ohElement = oracleHomeList.ownerDocument.createElement("OracleHome")
 	    oracleHomeList.appendChild(ohElement)

      set pathElement = ohElement.ownerDocument.createElement("path")
      ohElement.appendChild(pathElement)

      If ((not isNull(oracleHome)) and (oracleHome <> "")) Then
        set text = ohElement.ownerDocument.createTextNode(oracleHome)
        pathElement.appendChild(text)
      End If
      
      set keyElement = ohElement.ownerDocument.createElement("key")
      ohElement.appendChild(keyElement)

      If ((not isNull(oracleHomeKey)) and (oracleHomeKey <> "")) Then
        set text = ohElement.ownerDocument.createTextNode(oracleHomeKey)
        keyElement.appendChild(text)
      End If
             
      set nameElement = ohElement.ownerDocument.createElement("name")
      ohElement.appendChild(nameElement)
      
      If ((not isNull(oracleHomeName)) and (oracleHomeName <> "")) Then
        set text = ohElement.ownerDocument.createTextNode(oracleHomeName)
        nameElement.appendChild(text)
      End if

      set sidElement = ohElement.ownerDocument.createElement("sid")
      ohElement.appendChild(sidElement)
    
      If ((not isNull(oracleSID)) and (oracleSID <> "")) Then
        set text = ohElement.ownerDocument.createTextNode(oracleSID)
        sidElement.appendChild(text)
      End If

    End If
  
  End Sub
  
  Private Sub loadOracleHomeList(oracleHomeList)

    Const oraclePath = "SOFTWARE\ORACLE"   
    Const HKLM = &h80000002

    DIM keyValue, sName, sValue, cSubKeys 
                
    cSubKeys = EnumSubKeys(HKLM,oraclePath,64)
    If not isNull(cSubKeys) Then 
   	  For Each sName In cSubKeys
        sValue = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME", 64)
        If (not IsNull( sValue )) Then
          oracleHome = sValue
          oracleHomeName = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME_NAME", 64) 
          oracleHomeKey = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME_KEY", 64) 
          oracleSID = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_SID", 64) 

          processOracleHome OracleHomeList, oracleHome, OracleHomeName, OracleHomeKey, OracleSID

        End If
  	  Next 
    End If    

    cSubKeys = EnumSubKeys(HKLM,oraclePath,32)
    If not isNull(cSubKeys) Then 
     	For Each sName In cSubKeys
        sValue = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME", 32) 
        If (not IsNull( sValue )) Then
          oracleHome = sValue
          oracleHomeName = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME_NAME", 64) 
          oracleHomeKey = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_HOME_KEY", 64) 
          oracleSID = ReadRegStr (HKLM, oraclePath & FILE_SEPERATOR & sName, "ORACLE_SID", 64) 
          
          processOracleHome OracleHomeList, oracleHome, OracleHomeName, OracleHomeKey, OracleSID
          
        End If
  	  Next 
    End If
  
  End Sub

  Public Function findDesktopPath()
   
    Dim path
    path = getWShell().SpecialFolders("Desktop")
    findDesktopPath = path
    
  End Function

  Public Function findStartMenuPath()
   
    Dim path
    path = getWShell().SpecialFolders("StartMenu")
    findStartMenuPath = path
    
  End Function

  Private Function findWordPath()

    Dim appObject, appPath, CLSID, REGKEY
    
    On Error Resume Next
          
    CLSID = getWShell().RegRead("HKLM\SOFTWARE\Classes\Word.Application\CLSID\")
    If Err.Number = 0 Then
      ' MSGBOX "CLSID for Word.Application = " & CLSID, vbCritical
      If isWindows64 Then
      	REGKEY = "HKCR\Wow6432Node\CLSID\" & CLSID & "\LocalServer32\"
        ' MSGBOX  "Detected 64 Bit Environment : Using " & REGKEY, vbCritical
      Else
    	  REGKEY = "HKLM\SOFTWARE\Classes\CLSID\" & CLSID & "\LocalServer32\"
        ' Wscript.Echo "Detected 32 Bit Environment : Using " & REGKEY
      End If
    
      appPath = getWShell().RegRead(REGKEY)
      appPath = Mid(appPath,1,instr(appPath," "))
    Else
      ' MSGBOX "Could Not find CLSID for ""Word.Application"" in registry : Trying to Instantiate ""Word.Application"" ", vbCritical
      Set appObject = createObject("Word.Application")
      If Err.Number = 0 Then
        appPath = appObject.path & FILE_SEPERATOR & "WINWORD.EXE"
        appObject.quit
      Else
        ' Wscript.Echo "Failed instantiate ""Word.Application"""
        appPath = "c:\program files\msoffice\bin\WINWORD.EXE"        
      End If
  
      If Not IsNull(appObject) Then
        appObject.quit
      End If

    End If
    
    findWordPath = rtrim(appPath)

  End Function

  Private Function findExcelPath()

    Dim appObject, appPath, CLSID, REGKEY
    
    On Error Resume Next
           
    CLSID = getWShell().RegRead("HKLM\SOFTWARE\Classes\Excel.Application\CLSID\")
    If Err.Number = 0 Then
      ' Wscript.Echo "CLSID for Word.Application = " & CLSID
      If isWindows64 Then
       	REGKEY = "HKCR\Wow6432Node\CLSID\" & CLSID & "\LocalServer32\"
        ' Wscript.Echo "Detected 64 Bit Environment : Using " & REGKEY
      Else
        REGKEY = "HKLM\SOFTWARE\Classes\CLSID\" & CLSID & "\LocalServer32\"
        ' Wscript.Echo "Detected 32 Bit Environment : Using " & REGKEY
      End If
    
      appPath = getWShell().RegRead(REGKEY)
      appPath = Mid(appPath,1,instr(appPath," "))
    Else
      ' Wscript.Echo "Could Not find CLSID for ""Excel.Application"" in registry : Trying to Instantiate ""Excel.Application"" "
      Set appObject = createObject("Excel.Application")
      If Err.Number = 0 Then
        appPath = appObject.path & FILE_SEPERATOR & "EXCEL.EXE"
        appObject.quit
      Else
        ' Wscript.Echo "Failed instantiate ""Excel.Application"""
        appPath = "c:\program files\msoffice\bin\EXCEL.EXE"        
      End If
  
      If Not IsNull(appObject) Then
        appObject.quit
      End If

    End If
      
    findExcelPath = rtrim(appPath)
        
  End Function
  
  Public Function setScriptGenerationMode
    scriptGenerationMode = True
  End Function
  
  Public Function isScriptGenerator()
    isScriptGenerator = (scriptGenerationMode = True)
  End Function

  Public Sub addMacro(key,value)
       macroList.item(key) =  value
  End Sub
  
  Public function generateSedCommand

       Dim sedCommand, keys, i, key

       sedCommand = "sed"
       keys = macroList.keys
       For i = 0 to (UBound(keys))
        key = keys(i) 
        sedCommand = sedCommand + " -e ""s|" & key & "|" & replace(macroList.Item(key),"/","\/") & "|g"""
      Next
      sedCommand = sedCommand & " -e ""s|\$USER|$USER|g"" -e ""s|\$SERVER|$SERVER|g"""
      
      generateSedCommand = sedCommand
 
  End Function
  
  Public Function replaceMacros(value,skipPasswords)

       Dim keys, i, key
       keys = macroList.keys
       For i = 0 to (UBound(keys))
        key = keys(i) 
        If (skipPasswords) Then
        	If (InStr(UCase(key),"PASSWORD")) Then
        		key = ""
          End If
        End If
        If InStr(value,key) Then
          value = replace(value,key,macroList.Item(key))
	       End If
      Next
 
      replaceMacros = value
  
  End Function 

  Public Sub appendOracleHomeList(installationParameters)
     
     dim ohlElement
     
     set ohlElement = installationParameters.createElement("OracleHomeList")
     installationParameters.documentElement.appendChild(ohlElement)
     loadOracleHomeList(ohlElement)
     
  End Sub

  Public Sub loadDemonstrationParameters() 

    Dim filename, result, errorMessage
    Dim nodeList, i, parameter, parameterName, parameterValue

    filename = getInstallFolderPath() & FILE_SEPERATOR & getDemoFolderName() + ".xml"
    Set demonstrationParameters = CreateObject("Msxml2.FreeThreadedDOMDocument.6.0")
    demonstrationParameters.async = false
    result = demonstrationParameters.load(filename)
  
    If (result = False) Then 
      errorMessage = "Error while loading or parsing file : " & filename
      exitFatalError(errorMessage)
    End If
 
    Set nodeList = demonstrationParameters.documentElement.selectNodes("/installerConfiguration/parameters/parameter")
    For i = 0 to nodeList.length - 1
      Set parameter = nodeList.item(i)
      parameterName  = parameter.getAttribute("name")
      parameterValue = parameter.getAttribute("value")
      addMacro parameterName, replaceMacros(parameterValue,false)
    Next 
  
  End Sub 

  Private Sub Class_Initialize()
  
    dim installerPath, scriptFile, filename, result, errorMessage, wow6432Node

    'scriptPath         = WScript.ScriptFullName
    'Set WSHELL         = WScript.CreateObject("WScript.Shell")
    'Set FSO            = WScript.CreateObject("Scripting.FileSystemObject")

    On Error Resume Next
    If IsObject(window) Then
	    interactiveInstall = (Err.Number = 0)
	  End If
    On Error Goto 0

    scriptGenerationMode = False
    If IsObject(SCRIPT_GENERATOR) Then
    	scriptGenerationMode = True
    End If

    Set WSHELL          = CreateObject("WScript.Shell")
    Set FSO             = CreateObject("Scripting.FileSystemObject")
    Set macroList       = CreateObject("Scripting.Dictionary")
             
    windowsVersion      = wShell.RegRead("HKLM\Software\Microsoft\Windows NT\CurrentVersion\CurrentVersion")
  
    wow6432Node  = wShell.RegRead("HKCR\Wow6432Node\")
    If Err.Number = 0 Then
      sixtyFourBitWindows = TRUE
    Else
      sixtyFourBitWindows = FALSE
    End If
    
    addMacro "%DESKTOP%",        findDesktopPath()
    addMacro "%STARTMENU%",      findStartMenuPath()
    addMacro "%WINWORD%",        findWordPath()
    addMacro "%EXCEL%",          findExcelPath()

    If isInteractiveInstall() Then
      'Interactive : Internet Explorer HTML Application (HTA)
    	' wscript.Echo "Interactive"
      installerPath = Mid(document.location.href ,9)    
    Else
    	If isScriptGenerator() Then
        ' Script : Install Script Generator
	    	' wscript.Echo "Script Generation Mode"
        installerPath = SCRIPT_GENERATOR.getInstallerPath()
      Else
    	  ' Batch : Bulk Install via Command Line
	    	' wscript.Echo "Batch"
       	installerPath = MINSTALLER.getInstallerPath()
      End If
    End If

    ' Wscript.echo "Path =  " & installerPath
    Set scriptFile = getFSO().getFile(installerPath) 
        
    addMacro "%DEMODIRECTORY%",  scriptFile.parentFolder.parentFolder.path
    addMacro "%DEMOFOLDERNAME%", scriptFile.parentFolder.parentFolder.name
 
    filename = getInstallFolderPath() & FILE_SEPERATOR & "installParameters.xml"
    Set installationParameters = CreateObject("Msxml2.FreeThreadedDOMDocument.6.0")
    installationParameters.async = false
    result = installationParameters.load(filename)
    
    If (result = False) Then 
    	errorMessage = "Error while loading or parsing file : " & filename
      exitFatalError(errorMessage)
    End If
    
    appendOracleHomeList(installationParameters)

    loadDemonstrationParameters()
    
  End Sub   

  Public Function isInteractiveInstall()
    isInteractiveInstall = interactiveInstall
  End Function
  
  Public Function getOracleHomeFromRegistry()
    getOracleHomeFromRegistry = oracleHome
  End Function

  Public Function getTNSAliasFromRegistry()
    getTNSAliasFromRegistry = oracleSID
  End Function

  Public Function getWindowsVersion
     getWindowsVersion = windowsVersion
  End Function
    
  Private Function isWindows64 
    isWindows64 = sixtyFourBitWindows
  End Function
  
  Public Function getWShell()
    Set getWShell = WSHELL
  End Function
  
  Public Function getFSO()
    Set getFSO = FSO
  End Function  

  Public Function getInstallationParameters()
    Set getInstallationParameters = installationParameters
  End Function
  
  Public Function getShortCutFolderPath()
    getShortCutFolderPath = macroList.Item("%SHORTCUTFOLDER%") 
  End Function

  Public Function getShortCutFolderName()
    getShortCutFolderName = getFSO().getFileName(getShortCutFolderPath())
  End Function

  Public Function getLaunchPad()
    getLaunchPad = macroList.Item("%LAUNCHPAD%") 
  End Function

  Public Function getLaunchPadFolderPath()
    getLaunchPadFolderPath = macroList.Item("%LAUNCHPADFOLDER%") 
  End Function

  Public Function getLaunchPadFolderName()
    getLaunchPadFolderName = getFSO().getFileName(getLaunchPadFolderPath())
  End Function

  Public Function getDesktopPath()
    getDesktopPath = macroList.Item("%DESKTOP%")
  End Function

  Public Function getStartMenuPath()
    getDesktopPath = macroList.Item("%STARTMENU%")
  End Function

	Public Function getWordPath()
    getWordPath = macroList.Item("%WINWORD%")
  End Function
  
  Public Function getExcelPath()
    getExcelPath = macroList.Item("%EXCEL%")
  End Function

  Public Function getDemoFolderName()
    getDemoFolderName = macroList.Item("%DEMOFOLDERNAME%")
  End Function

  Public Function getDemoDirectory()
    getDemoDirectory = macroList.Item("%DEMODIRECTORY%")
  End Function

  Public Function getDemonstrationName()
    getDemonstrationName = macroList.Item("%DEMONAME%")
  End Function

  Public Function getOracleHome()
    getOracleHome = macroList.Item("%ORACLEHOME%")
  End Function

  Public Function getDBAUsername()
    getDBAUsername = macroList.Item("%DBA%")
  End Function

  Public Function getDBAPassword()
    getDBAPassword = macroList.Item("%DBAPASSWORD%")
  End Function

  Public Function getUsername()
    getUsername = macroList.Item("%USER%")
  End Function

  Public Function getPassword()
    getPassword = macroList.Item("%PASSWORD%")
  End Function

  Public Function getTNSAlias()
    getTNSAlias = macroList.Item("%TNSALIAS%")
  End Function

  Public Function getListener()
    getListener = macroList.Item("%LISTENER%")
  End Function

  Public Function getSQLPort()
    getSQLPort = macroList.Item("%SQLPORT%")
  End Function

  Public Function getHostName()
    getHostName = macroList.Item("%HOSTNAME%")
  End Function

  Public Function getHTTPPort()
    getHTTPPort = macroList.Item("%HTTPPORT%")
  End Function

  Public Function getFTPPort()
    getFTPPort = macroList.Item("%FTPPORT%")
  End Function

  Public Function getDriveLetter()
    getDriveLetter = macroList.Item("%DRIVELETTER%")
  End Function

  Public Function getServerURL()
    getServerURL = macroList.Item("%SERVERURL%")
  End Function
 
  Public Function getConnectString
     getConnectString = macroList.Item("%DBCONNECTION%")
  End Function

  Public Function getSqlPlusPath
     getSqlPlusPath = macroList.Item("%SQLPLUS%")
  End Function

  Public Function getSqlldrPath
    getSqlldrPath = macroList.Item("%SQLLDR%")
  End Function
 
  Public Function getLocalFolderPath
    getLocalFolderPath = getDemoDirectory()  & FILE_SEPERATOR & getUsername()
  End Function

  Public Function getInstallFolderPath
    getInstallFolderPath = getDemoDirectory()  & FILE_SEPERATOR & "install"
  End Function
 
  Public Function getLogFilePath()

		' In Interactive Mode the Log File should be written to the Install Folder (which is where the install should be run from)
    ' In Script Generation Mode the Log file should be written to the Install Folder
    ' In Batch Mode the Log file should be written to the Folder that contains the MasterInstallation file

    If isInteractiveInstall() or isScriptGenerator() Then 
      getLogFilePath = getInstallFolderPath() & FILE_SEPERATOR & getDemoFolderName() & ".log"   
    Else
      getLogFilePath = getWShell().CurrentDirectory & FILE_SEPERATOR & getDemoFolderName() & ".log"	
    End If

  End Function
 
  Public Function getScriptsFolderPath
    getScriptsFolderPath = getLocalFolderPath() & FILE_SEPERATOR & "Scripts"
  End Function
  
  Private Function readInputField(fieldName)
   
    Dim target
    set target = Document.getElementById(fieldName)
    readInputField = target.value   

  End Function
  
  Public Function readOracleHome()
    readOracleHome = readInputField("oracleHome")
  End Function

  Public Function readTNSAlias()
    readTNSAlias = readInputField("tnsAlias")
  End Function

  Public Function readDBAUsername()
    readDBAUsername = readInputField("dbaUsername")
  End Function

  Public Function readDBAPassword()
    readDBAPassword = readInputField("dbaPassword")
  End Function

  Public Function readUsername()
    readUsername = readInputField("oracleUsername")
  End Function

  Public Function readPassword()
    readPassword = readInputField("oraclePassword")
  End Function

  Public Function readSYSPassword()
    readSYSPassword = readInputField("sysPassword")
  End Function

 Public Function readHostName()
    readHostName = readInputField("hostName")
  End Function

  Public Function readHttpPort()
    readHttpPort = readInputField("httpPort")
  End Function

  Public Function readFtpPort()
    readFtpPort = readInputField("ftpPort")
  End Function

  Public Function readListener()

    Dim target    
    set target = Document.getElementById("listener")
    If (Not target Is Nothing) Then
      readListener = target.value
  	End If
       
  End Function

  Public Function readSQLPort()
  
    Dim target
    
    set target = Document.getElementById("sqlPort")
    If (Not target Is Nothing) Then
      readSQLPort = target.value
  	End If
       
  End Function

  Public Function readDriveLetter()
  
    If getWindowsVersion >= 6.1 Then
      Dim target
      set target = Document.getElementById("driveLetter")
      If (target Is Nothing) Then
    	  readDriveLetter = Null
      Else
        readDriveLetter = target.value
      End If
    Else
    	readDriveLetter = Null
    End If
    
  End Function

  Public Sub setInstallationParameters(oracleHome, tnsAlias, hostname, httpPort, ftpPort, driveLetter, dba, dbaPassword, username, password)

    addMacro "%ORACLEHOME%",     oracleHome
  
    addMacro "%DBA%",            dba
    addMacro "%DBAPASSWORD%",    dbaPassword
    addMacro "%USER%",           username
    addMacro "%PASSWORD%",       password

    addMacro "%TNSALIAS%",       tnsAlias
    addMacro "%HOSTNAME%",       hostName
    addMacro "%HTTPPORT%",       httpPort
    addMacro "%FTPPORT%",        ftpPort
    
    addMacro "%DRIVELETTER%",    driveLetter
    
    addMacro "%SERVERURL%",      "http://" & getHostName() & ":" & getHttpPort()
    addMacro "%DBCONNECTION%",   getUsername() & "/" & getPassword() & "@" & getTNSAlias()

		If (not isScriptGenerator()) Then
		  validOracleHome(INSTALLER) 
		End If
    

  End Sub

  Public Function readInstallationDialog()
   
    addMacro "%ORACLEHOME%",     readOracleHome()
    addMacro "%DBA%",            readDBAUsername()
    addMacro "%DBAPASSWORD%",    readDBAPassword()
    addMacro "%USER%",           readUsername()
    addMacro "%PASSWORD%",       readPassword()

    addMacro "%TNSALIAS%",       readTnsAlias()
    addMacro "%LISTENER%",       readListener()
    addMacro "%SQLPORT%",        readSQLPort()
 
    addMacro "%HOSTNAME%",       readHostname()
    addMacro "%HTTPPORT%",       readHttpPort()
    addMacro "%FTPPORT%",        readFtpPort()
    
    addMacro "%DRIVELETTER%",    readDriveLetter()

    addMacro "%SERVERURL%",      "http://" & getHostName() & ":" & getHttpPort()
    addMacro "%DBCONNECTION%",   getUsername() & "/" & getPassword() & "@" & getTNSAlias()
    
  End Function

  Public Function getDemonstrationParameter(xpath)
  
    Set getDemonstrationParameter = demonstrationParameters.documentElement.selectNodes(xpath)
  
  End Function
  
  
  Public Function requiresSYSDBA()
  
    Dim nl,target
    set nl = demonstrationParameters.documentElement.selectNodes("/installerConfiguration/installation/action[@type=""SYSDBA""]")
    If (nl.length = 0) Then
	    requiresSYSDBA = false
	  Else
      requiresSYSDBA = true
    End If
    
  End Function
  
  
  Public Function doHTTPTrace()
   
    Dim nl,target
    set nl = demonstrationParameters.documentElement.selectNodes("/installerConfiguration/parameters/parameter[@name=""enableHTTPTrace"" and @value=""true""]")
    If (nl.length = 0) Then
	    doHTTPTrace = false
	  Else
      doHTTPTrace = true
    End If
    
  End Function

  Public Function useFtpProtocol()
   
    Dim nl,target
    set nl = demonstrationParameters.documentElement.selectNodes("/installerConfiguration/parameters/parameter[@name=""protocol"" and @value=""FTP""]")
    If (nl.length = 0) Then
	    useFtpProtocol = false
	  Else
      useFtpProtocol = true
    End If
    
  End Function
     
  Private function verifySqlPlusPath
  
  End function

  Function isOracleHomeValid
    
    dim path

    path = getOracleHome() & "\bin\sqlplus.exe"
    If (FSO.fileExists(path)) Then
      addMacro "%SQLPLUS%", path
	    path = getOracleHome() & "\bin\sqlldr.exe"
      addMacro "%SQLLDR%", path
    	isOracleHomeValid = true
      Exit Function
    End If

    path = getOracleHome() & "\sqlplus.exe"
    If (FSO.fileExists(path)) Then
      addMacro "%SQLPLUS%", path
	    path = getOracleHome() & "\sqlldr.exe"
      addMacro "%SQLLDR%", path
    	isOracleHomeValid = true
      Exit Function
    End If
    
  	isOracleHomeValid = false
  
  End Function

End Class