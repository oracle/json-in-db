<?xml version="1.0" encoding="UTF-8"?>
<!--

/* ================================================  
 * Oracle XML/JSON Demonstration Installer.    
 *    
 * Copyright (c) 2014 Oracle and/or its affiliates.  All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ================================================
 */

-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
	<xsl:output method="html"/>
	<xsl:template name="shortCutFolderName">
		<tr>
			<td>Demonstration Name</td>
			<td colspan="5">
				<input size="64" name="demonstrationName" id="demonstrationName" disabled="disabled"/>
			</td>
		</tr>
	</xsl:template>
	<xsl:template name="oracleHome">
		<tr>
			<td>Oracle Home</td>
			<td>
				<select id="oracleHomeSelector" size="1" onchange="setOracleHome">
					<option name="Manual" value="Manual">Manual</option>
					<xsl:for-each select="OracleHomeList/OracleHome">
						<option>
							<xsl:attribute name="name"><xsl:value-of select="name"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="name"/></xsl:attribute>
							<xsl:if test="position() = last()">
								<xsl:attribute name="selected">selected</xsl:attribute>
							</xsl:if>
							<xsl:value-of select="name"/>
						</option>
					</xsl:for-each>
				</select>
			</td>
			<td colspan="2">
				<input size="36" name="oracleHome" id="oracleHome">
				</input>
			</td>
		</tr>
	</xsl:template>
	<xsl:template name="dba">
		<tr>
			<td>DBA User</td>
			<td>
				<xsl:for-each select="dba">
					<input name="dbaUsername" id="dbaUsername">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</xsl:for-each>
			</td>
			<td>Password</td>
			<td align="right">
				<xsl:for-each select="dbaPassword">
					<input type="password" name="dbaPassword" id="dbaPassword">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>
	<xsl:template name="oracleUser">
		<tr>
			<td>Install as </td>
			<td>
				<xsl:for-each select="oracleUser">
					<input name="oracleUsername" id="oracleUsername">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</xsl:for-each>
			</td>
			<td>Password</td>
			<td align="right">
				<xsl:for-each select="oraclePassword">
					<input type="password" name="oraclePassword" id="oraclePassword">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>
	<xsl:template name="tnsAlias">
		<tr>
			<td>TNSAlias</td>
			<td>
				<input name="tnsAlias" id="tnsAlias">
				</input>
			</td>
			<td>Host Name</td>
			<td align="right">
				<xsl:for-each select="hostName">
					<input name="hostName" id="hostName">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>
	<xsl:template name="driveLetter">
		<xsl:for-each select="driveLetter">
			<tr>
				<td>Drive Letter</td>
				<td align="left">
					<input name="driveLetter" id="driveLetter">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</td>
				<td/>
				<td/>
			</tr>
		</xsl:for-each>
	</xsl:template>
	<xsl:template name="httpPort">
		<tr>
			<td>HTTP Port </td>
			<td>
				<xsl:for-each select="httpPort">
					<input name="httpPort" id="httpPort">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</xsl:for-each>
			</td>
			<td>FTP port</td>
			<td align="right">
				<xsl:for-each select="ftpPort">
					<input name="ftpPort" id="ftpPort">
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
					</input>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>
	<xsl:template match="/">
		<xsl:for-each select="installationParameters">
			<table style="background-color:#ECE9D8;">
				<tbody>
					<xsl:call-template name="shortCutFolderName"/>
					<xsl:call-template name="oracleHome"/>
					<xsl:call-template name="dba"/>
					<xsl:call-template name="oracleUser"/>
					<xsl:call-template name="tnsAlias"/>
					<xsl:call-template name="httpPort"/>
					<xsl:call-template name="driveLetter"/>
					<tr align="left">
						<td>
							<input type="button" name="getPorts" value="Load Ports" onclick="getPorts()"/>
						</td>
						<td colspan="2"/>
						<td align="right">
							<input type="button" name="doCancel" value="Cancel" onclick="cancelInstall()"/>
							<xsl:text>&#160;</xsl:text>
							<input type="button" name="doInstall" value="Install" onclick="doInstall()"/>
						</td>
					</tr>
					<tr>
						<td colspan="4">
							<div id="installationArea" style="display: none;">
								<textarea rows="1" cols="65" id="installationLog" name="installationLog" readonly="true" wrap="OFF"/>
							</div>
						</td>
					</tr>
					<tr>
						<td colspan="4">
							<div id="progressBar"/>
						</td>
					</tr>
					<tr>
						<td colspan="4">
							<hr/>
						</td>
					</tr>
					<tr>
						<td colspan="4">
							<input id="currentTask" type="text" size="85" readonly="true"/>
						</td>
					</tr>
				</tbody>
			</table>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>
