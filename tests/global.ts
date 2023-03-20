import { Sequelize } from 'sequelize'

import { testDatabaseName, testDatabaseWorkerName, testMainDB } from '../config/database'
import { modelsBuilder } from '../src/db/models/indexModels'
import { UserTokenModel } from '../src/db/models/userToken'
import { UserModel } from '../src/db/models/user'

const connection = new Sequelize(`${testMainDB.baseUrl}/postgres`, testMainDB.options)

export const mochaGlobalSetup = async () => {
	try {
		const seq = new Sequelize(testMainDB.url, testMainDB.options)
		await Promise.all([
			connection.authenticate(),
			seq.authenticate()
		])
		const models = modelsBuilder(seq)

		UserTokenModel.belongsTo(models.User, { foreignKey: 'userID' })
		UserModel.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' })
		UserModel.belongsTo(models.User, { as: 'editor', foreignKey: 'updatedBy' })
		UserModel.belongsTo(models.User, { as: 'destructor', foreignKey: 'deletedBy' })
		UserModel.hasMany(models.UserToken, { foreignKey: 'userID' })

		// sync db
		await seq.sync({ force: true })

		await seq.close()

		return Promise.resolve()
	} catch (err) {
		console.log('mochaGlobalSetup error: ', err)
		return Promise.reject(err)
	}
}

export async function mochaGlobalTeardown() {
	try {
		// remove test databases after all test finished
		const [testDatabases]: [any[], any] = await connection.query(`select datname from pg_database where datname like '${testDatabaseName}_%'`)
		await Promise.all(testDatabases.map((testDatabase) => connection.query(/* SQL */`DROP DATABASE IF EXISTS ${testDatabase.datname} WITH (FORCE);`)))

		await connection.close()

		return Promise.resolve()
	} catch (err) {
		console.log('mochaGlobalTeardown error: ', err)
		return Promise.reject(err)
	}
}

export const mochaHooks = async () => {
	// create jwt access tokens
	return {
		async beforeAll() {
			try {
				const isUnitTest = (this as any).test.parent.suites.every((el: any) => /unit.test/.test(el.file))
				if (!isUnitTest) {
					// drop test database for worker
					await connection.query(/* SQL */`DROP DATABASE IF EXISTS ${testDatabaseWorkerName} WITH (FORCE);`)

					// create test database for worker
					await connection.query(/* SQL */`CREATE DATABASE ${testDatabaseWorkerName} TEMPLATE ${testDatabaseName};`)
				}

				return Promise.resolve()
			} catch (err) {
				console.log('beforeAll error: ', err)
				return Promise.reject(err)
			}
		},
		async afterAll() {
			try {
				return Promise.resolve()
			} catch (err) {
				console.log('afterAll error: ', err)
				return Promise.reject(err)
			}
		}
	}
}
