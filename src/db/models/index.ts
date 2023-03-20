/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */
/* eslint-disable import/no-cycle */
import pg from 'pg'
import path from 'path'
import fs from 'fs'
import {
	Sequelize,
} from 'sequelize'

import * as database from '../../../config/database'

// types
import { IRestoreHookFunctions } from '../../types/models'

import { modelsBuilder } from './indexModels'
import { UserTokenModel } from './userToken'
import { UserModel } from './user'

// NOTE: set true because otherwise BIGINT return string instead of integer https://github.com/sequelize/sequelize/issues/1774
pg.defaults.parseInt8 = true

// eslint-disable-next-line import/namespace
const { url, options: dbOptions } = database['test']

if (dbOptions.logging) {
	dbOptions.logging = (log: string) => {
		console.log(log, { language: 'sql', ignoreIllegals: true, theme: 'code' })
	}
}

const sequelize = <Sequelize & IRestoreHookFunctions> new Sequelize(url, dbOptions)
sequelize.authenticate()
	.then(() => console.log('Database connection has been established successfully'))
	.catch((err: any) => console.log(`Unable to connect to the database: ${err}`))

const buildModels = () => {
	const models = modelsBuilder(sequelize)

	UserTokenModel.belongsTo(models.User, { foreignKey: 'userID' })
	UserModel.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' })
	UserModel.belongsTo(models.User, { as: 'editor', foreignKey: 'updatedBy' })
	UserModel.belongsTo(models.User, { as: 'destructor', foreignKey: 'deletedBy' })
	UserModel.hasMany(models.UserToken, { foreignKey: 'userID' })

	return models
}

const models = buildModels()
type Models = typeof models

export { models }
export type { Models }
export default sequelize
