package com.oracle.st.pm.json.movieTicketing.jetty;


import java.util.Optional;

import org.eclipse.jetty.server.NCSARequestLog;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

public class App {
    
    public static final Optional<String> port = Optional.ofNullable(System.getenv("PORT"));   ; 
    
    public static NCSARequestLog getRequestLogger() {
        NCSARequestLog requestLog = new NCSARequestLog();
        requestLog.setFilename("yyyy_mm_dd.request.log");
        requestLog.setFilenameDateFormat("yyyy_MM_dd");
        requestLog.setRetainDays(90);
        requestLog.setAppend(true);
        requestLog.setExtended(true);
        requestLog.setLogCookies(false);
        requestLog.setLogTimeZone("GMT"); // or GMT+2 and so on. 
        return requestLog;
    }
        public static void main(String[] args) throws Exception {
        
        Server jettyServer = new Server(Integer.parseInt(port.orElse("8081")));
        // jettyServer.setRequestLog(getRequestLogger()); // here will set global request log

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        jettyServer.setHandler(context);
        
        // Create the Jersey Servlet and tell it which REST service/class to load.
        ServletHolder jerseyServlet =
            context.addServlet(org.glassfish.jersey.servlet.ServletContainer.class, "/movieticket/*");
        jerseyServlet.setInitOrder(0);
        jerseyServlet.setInitParameter("jersey.config.server.provider.classnames",
                                       com.oracle.st.pm.json.movieTicketing.service.Routes.class.getCanonicalName());

        ServletHolder defaultServlet = new ServletHolder("static", DefaultServlet.class);
        defaultServlet.setInitParameter("resourceBase", "static");
        defaultServlet.setInitParameter("dirAllowed", "false");
        defaultServlet.setInitParameter("pathInfoOnly", "true");
        context.addServlet(defaultServlet, "/*");

        ServletHolder frameworksServlet = new ServletHolder("frameworks", DefaultServlet.class);
        frameworksServlet.setInitParameter("resourceBase", "node_modules");
        frameworksServlet.setInitParameter("dirAllowed", "true");
        frameworksServlet.setInitParameter("pathInfoOnly", "true");
        context.addServlet(frameworksServlet, "/frameworks/*");
        
        try {
            jettyServer.start();
            jettyServer.join();
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        } finally {
            jettyServer.stop();
            jettyServer.destroy();
        }
    }
}
