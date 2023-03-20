import {
	DataTypes, Sequelize, UpdateOptions
} from 'sequelize'

import { createSlug } from '../../utils/helper'
import { UUIDUserDefinition, UUIDUserModel } from '../../../repos/user-repositories/user-repository-sequelize/src'

export class UserModel extends UUIDUserModel {}

export default (sequelize: Sequelize, modelName: string) => {
	UserModel.init({
		...UUIDUserDefinition,
		// overload createdBy column definition
		createdBy: {
			type: DataTypes.UUID,
			allowNull: true
		},
		// virtual attributes
		fullName: {
			type: DataTypes.VIRTUAL,
			get() {
				return (`${this.name ?? ''} ${this.surname ?? ''}`).trim()
			}
		}
	}, {
		paranoid: true,
		timestamps: true,
		sequelize,
		modelName,
		tableName: 'users',
		hooks: {
			beforeValidate: (user, options) => {
				if (user.changed('email')) {
					user.emailSlug = createSlug(user.email)
					options.fields?.push('emailSlug')
				}
				if (user.changed('name')) {
					user.nameSlug = createSlug(user.name)
					options.fields?.push('nameSlug')
				}
				if (user.changed('surname')) {
					user.surnameSlug = createSlug(user.surname)
					options.fields?.push('surnameSlug')
				}
				if (user.changed('phone')) {
					user.phoneSlug = createSlug(user.phone)
					options.fields?.push('phoneSlug')
				}
			},
			beforeCreate: (user) => {
				if (user.email) {
					user.emailSlug = createSlug(user.email)
				}
				if (user.name) {
					user.nameSlug = createSlug(user.name)
				}
				if (user.surname) {
					user.surnameSlug = createSlug(user.surname)
				}
				if (user.phone) {
					user.phoneSlug = createSlug(user.phone)
				}
			},
			beforeUpdate: (user) => {
				if (user.changed('name')) {
					user.nameSlug = createSlug(user.name)
				}
				if (user.changed('surname')) {
					user.surnameSlug = createSlug(user.surname)
				}
				if (user.changed('phone')) {
					user.phoneSlug = createSlug(user.phone)
				}
			},
			beforeBulkCreate: (users) => {
				users.forEach((user) => {
					if (user.email) {
						user.emailSlug = createSlug(user.email)
					}
					if (user.name) {
						user.nameSlug = createSlug(user.name)
					}
					if (user.surname) {
						user.surnameSlug = createSlug(user.surname)
					}
					if (user.phone) {
						user.phoneSlug = createSlug(user.phone)
					}
				})
			},
			beforeBulkUpdate: (options: UpdateOptions & { attributes: any }) => {
				options.attributes = {
					...options.attributes
				}

				if (options.attributes.name !== undefined) {
					options.attributes.nameSlug = createSlug(options.attributes.name) || null
					options.fields?.push('nameSlug')
				}
				if (options.attributes.surname !== undefined) {
					options.attributes.surnameSlug = createSlug(options.attributes.surname) || null
					options.fields?.push('surnameSlug')
				}
				if (options.attributes.company !== undefined) {
					options.attributes.companySlug = createSlug(options.attributes.company) || null
					options.fields?.push('companySlug')
				}
				if (options.attributes.companyRole !== undefined) {
					options.attributes.companyRoleSlug = createSlug(options.attributes.companyRole) || null
					options.fields?.push('companyRoleSlug')
				}
				if (options.attributes.phone !== undefined) {
					options.attributes.phoneSlug = createSlug(options.attributes.phone) || null
					options.fields?.push('phoneSlug')
				}
			}
		}
	})

	return UserModel
}
