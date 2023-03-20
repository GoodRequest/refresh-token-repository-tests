import { assert, expect } from 'chai'
import { ID, IUserRepository } from '@goodrequest/passport-jwt-wrapper'
import { v4 as uuidv4 } from 'uuid';

export interface ITestUser<IDType extends ID> {
	id: IDType
	email: string
	password?: string
}

export function declareUserRepositoryTests<IDType extends ID>(userRepo: IUserRepository<IDType>, existingUsers: ITestUser<IDType>[]) {
	// test if there are some users seeded
	before(() => {
		if(existingUsers.length < 1) {
			throw new Error('Seed some users')
		}
	})

	const nonConfirmedUser = existingUsers.find((user) => !user.password)

	describe('Login', () => {
		it(`Wrong format id`, async () => {
			userRepo.getUserById('some random string' as IDType).then(() => assert.fail('was not supposed to succeed') ).catch((err) => {
				expect(err).to.exist
			})
		})

		it(`Non existing user`, async () => {
			let user
			if(typeof existingUsers[0].id === 'number') {
				user = await userRepo.getUserById(99999 as IDType)
			} else {
				user = await userRepo.getUserById(uuidv4() as IDType)
			}

			expect(user).not.to.exist
		})

		it(`User login`, async () => {
			const seedUser = existingUsers[0]
			const user = await userRepo.getUserById(seedUser.id)

			expect(user).to.exist
			expect(user?.hash).not.to.exist
			expect(user?.id).to.eq(seedUser.id)
		})
	})

	describe('Invitation', () => {
		if(userRepo.getNewUserById) {
			it(`Wrong format id`, async () => {
				userRepo.getNewUserById!('some random string' as IDType).then(() => assert.fail('was not supposed to succeed') ).catch((err) => {
					expect(err).to.exist
				})
			})

			it(`Non existing user`, async () => {
				let user
				if(typeof existingUsers[0].id === 'number') {
					user = await userRepo.getNewUserById!(99999 as IDType)
				} else {
					user = await userRepo.getNewUserById!(uuidv4() as IDType)
				}

				expect(user).not.to.exist
			})

			it('Get confirmed user by ID, should return null', async () => {
				const seedUser = existingUsers[0]
				const user = await userRepo.getNewUserById!(seedUser.id)
				expect(user).not.to.exist
			})

			if(nonConfirmedUser) {
				it('Get New User By ID', async () => {
					const user = await userRepo.getNewUserById!(nonConfirmedUser.id)
					expect(user).to.exist
					expect(user?.id).to.eq(nonConfirmedUser.id)
				})
			}
		} else {
			if(nonConfirmedUser) {
				it('Get (New) User By ID', async () => {
					const user = await userRepo.getUserById(nonConfirmedUser.id)
					expect(user).to.exist
					expect(user?.id).to.eq(nonConfirmedUser.id)
				})
			}
		}
	})
}
