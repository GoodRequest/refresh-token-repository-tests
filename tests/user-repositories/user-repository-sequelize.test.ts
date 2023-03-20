import { expect } from 'chai'
import { v4 as uuidv4 } from 'uuid';

import { UserRepository, UUIDUserModel } from '../../repos/user-repositories/user-repository-sequelize/src'
import { PERMISSION } from '../../repos/user-repositories/user-repository-sequelize/src/utils/enums'
import { models } from '../../src/db/models'
import { createHash } from '@goodrequest/passport-jwt-wrapper'
import { declareUserRepositoryTests } from './declareTests'

const repositoryPackageJson = require('../../repos/user-repositories/user-repository-sequelize/package.json')

const userData = [{
	email: 'admin@goodrequest.com',
	permission: PERMISSION.ADMINISTRATOR,
	isConfirmed: true
}, {
	email: 'test@goodrequest.com',
	permission: PERMISSION.USER,
	isConfirmed: true
}, {
	email: 'nonConfirmed@goodrequest.com',
	permission: PERMISSION.USER,
	isConfirmed: false
}]

const password = 'randomPass123.'
const { User } = models

describe(`${repositoryPackageJson.name}@${repositoryPackageJson.version}`, () => {

	describe('Good seeds', () => {
		const userRepo = new UserRepository(User)
		const dbUsers: UUIDUserModel[] = []

		before(async () => {
			const hash = await createHash(password)

			const mappedData = userData.map((data) => ({
				email: data.email,
				confirmedAt: data.isConfirmed ? Date.now() : null,
				hash: data.isConfirmed ? hash : null,
				permission: data.permission,
			}))

			const seedUsers = await User.bulkCreate(mappedData)
			dbUsers.push(...seedUsers)
		})

		declareUserRepositoryTests(userRepo, dbUsers)
	})

	describe('Wrong seeds', () => {
		const userRepo = new UserRepository(User)

		it('no seeds', async () => {
			const user = await userRepo.getUserById(uuidv4())
			expect(user).not.to.exist
		})

		it('More users with same email', async () => {
			const hash = await createHash(password)

			const data = {
				email: 'user@goodrequest.com',
				permission: PERMISSION.USER,
				confirmedAt: Date.now(),
				hash: hash,
			}

			const [seedUser1, seedUser2] = await User.bulkCreate([data, {
				...data,
				email: 'user@goodrequest.com',
			}])

			const user = await userRepo.getUserById(seedUser1.id)
			const user2 = await userRepo.getUserById(seedUser2.id)
			expect(user).to.exist
			expect(user2).to.exist
			expect(user?.id).not.to.eq(user2?.id)
			expect(user?.email).to.eq(user2?.email)
		})
	})
})
