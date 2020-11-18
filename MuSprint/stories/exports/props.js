// Properties file for the server instance
module.exports = {
	ping: { "health": "OK" },
	port: 5000,
	instantClientDir : process.env.NODE_ORACLEDB_ICPATH || "/Users/sriksure/Downloads/instantclient_19_8",
	db: {
		user: process.env.NODE_ORACLEDB_USER || "mustory_own",
		password: process.env.NODE_ORACLEDB_PASSWORD || "Str0ng_mustory_pwd",
		connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "localhost:1521/XE"
	}
};
