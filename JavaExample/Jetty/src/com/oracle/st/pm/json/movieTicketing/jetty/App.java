package com.oracle.st.pm.json.movieTicketing.jetty;


import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ContextHandler;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

public class App {
    public static void main(String[] args) throws Exception {
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");

        Server jettyServer = new Server(9999);
        jettyServer.setHandler(context);

        // Tells the Jersey Servlet which REST service/class to load.
        ServletHolder jerseyServlet =
            context.addServlet(org.glassfish.jersey.servlet.ServletContainer.class, "/movieticket/*");
        jerseyServlet.setInitOrder(0);
        jerseyServlet.setInitParameter("jersey.config.server.provider.classnames",
                                       com.oracle.st.pm.json.movieTicketing.service.Routes.class.getCanonicalName());

        ServletHolder defaultServlet = new ServletHolder("static-home", DefaultServlet.class);
        defaultServlet.setInitParameter("resourceBase", "public");
        defaultServlet.setInitParameter("dirAllowed", "false");
        defaultServlet.setInitParameter("pathInfoOnly", "true");
        context.addServlet(defaultServlet, "/*");

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
