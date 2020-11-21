// Properties file for the server instance
module.exports = {
	ping: { "health": "OK" },
	port: 5000,
	instantClientDir : process.env.NODE_ORACLEDB_ICPATH || "/Users/sriksure/Downloads/instantclient_19_8"
};
