/* eslint-disable import/no-cycle */
import { Sequelize } from 'sequelize'

import defineUser from './user'
import defineUserToken from './userToken'

const modelsBuilder = (instance: Sequelize) => ({
	User: defineUser(instance, 'user'),
	UserToken: defineUserToken(instance, 'userToken'),
})

// eslint-disable-next-line import/prefer-default-export
export { modelsBuilder }
