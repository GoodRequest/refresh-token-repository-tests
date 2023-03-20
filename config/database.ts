import { Options } from 'sequelize'

const url = 'postgresql://postgres:root@127.0.0.1:5432/auth_libs_test'
const [baseDB, ...base] = url.split( '/').reverse()

export const testDatabaseName = baseDB
export const testDatabaseWorkerName = `${baseDB}_${process.pid}`
export const test = {
	url: `${url}_${process.pid}`,
	options: <Options>{
		minifyAliases: true,
		logging: false,
		pool: {
			max: 4
		}
	}
}

export const testMainDB = {
	...test,
	baseUrl: base.reverse().join('/'),
	url
}
