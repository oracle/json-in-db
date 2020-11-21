// Properties file for the database instance
module.exports = {
		user: process.env.NODE_ORACLEDB_USER || "mustory_own",
		password: process.env.NODE_ORACLEDB_PASSWORD || "Str0ng_mustory_pwd",
		connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "localhost:1521/XE"
};
