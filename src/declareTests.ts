import { ID, IRefreshTokenRepository } from '@goodrequest/passport-jwt-wrapper'
import { expect } from 'chai'
import { v4 as uuidv4 } from 'uuid'

export interface ITestUser<IDType extends ID> {
	id: IDType
	email: string
	hash?: string
}

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function sleep (ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

export function declareRefreshTokenRepositoryTests<TokenIDType extends ID, UserIDType extends ID>(tokenRepo: IRefreshTokenRepository<TokenIDType, UserIDType>, existingUsers: ITestUser<UserIDType>[]) {
	// test if there are some users seeded
	before(() => {
		if (existingUsers.length < 2) {
			throw new Error('Seed some users (minimum 2)')
		}
	})

	describe('createTokenID', () => {
		it('Same Id', async () => {
			const promises: Promise<TokenIDType>[] = []
			for(let i = 0; i < 1000; i += 1) {
				promises.push(tokenRepo.createTokenID())
			}

			const ids = await Promise.all(promises)

			const set = new Set(ids)
			expect(set.size).to.eq(promises.length)
		})
	})

	describe('saveRefreshToken & isRefreshTokenValid', () => {
		it('Non existing token', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid).to.eq(false)
		})

		it('Save first token', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]
			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid).to.eq(true)
		})

		it('Save token with other non existing familyID', async () => {
			const id = await tokenRepo.createTokenID()
			const familyId = await tokenRepo.createTokenID()

			expect(id).not.to.eq(familyId)

			const user = existingUsers[0]
			await tokenRepo.saveRefreshToken(user.id, familyId, id, token, 5000)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, familyId, id)

			expect(valid).to.eq(true)
		})

		it('Save token with other familyID', async () => {
			const id = await tokenRepo.createTokenID()
			const familyId = await tokenRepo.createTokenID()

			expect(id).not.to.eq(familyId)

			const user = existingUsers[0]
			// familyID need to be id of existing token
			await tokenRepo.saveRefreshToken(user.id, familyId, familyId, token, 5000)
			tokenRepo.saveRefreshToken(user.id, familyId, id, token, 5000)
				.then(() => {
					throw new Error('was not supposed to succeed')
				})
				.catch(async (err) => {
					expect(err).to.exist
					const valid = await tokenRepo.isRefreshTokenValid(user.id, familyId, familyId)

					expect(valid).to.eq(true)
				})
		})

		it('Wrong familyID', async () => {
			const id = await tokenRepo.createTokenID()
			const familyId = await tokenRepo.createTokenID()

			expect(id).not.to.eq(familyId)

			const user = existingUsers[0]
			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, familyId, id)

			expect(valid).to.eq(false)
		})

		it('Non existing userID', async () => {
			const id = await tokenRepo.createTokenID()

			const user = existingUsers[0]
			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)

			let promise
			if (typeof existingUsers[0].id === 'number') {
				promise = tokenRepo.isRefreshTokenValid(9999 as UserIDType, id, id)
			} else {
				promise = tokenRepo.isRefreshTokenValid(uuidv4() as UserIDType, id, id)
			}

			promise
				.then(() => {
					throw new Error('was not supposed to succeed')
				})
				.catch((err) => {
					expect(err).to.exist
				})
		})

		it('Wrong format userID', async () => {
			const id = await tokenRepo.createTokenID()

			const user = existingUsers[0]
			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)

			tokenRepo.isRefreshTokenValid('something random' as UserIDType, id, id)
				.then(() => {
					throw new Error('was not supposed to succeed')
				})
				.catch((err) => {
					expect(err).to.exist
				})
		})

		it('Wrong userID', async () => {
			const id = await tokenRepo.createTokenID()

			const user = existingUsers[0]
			const user2 = existingUsers[1]
			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)

			const valid = await tokenRepo.isRefreshTokenValid(user2.id, id, id)

			expect(valid).to.eq(false)
		})

		it('Save 2 tokens with same tokenID', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]
			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)
			try {
				await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)
			} catch (err) {
				expect(err).to.exist

				const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)
				expect(valid).to.eq(true)
			}
		})

		it('Save 2 tokens with same tokenID, other user', async () => {
			const id = await tokenRepo.createTokenID()
			const user1 = existingUsers[0]
			const user2 = existingUsers[1]
			await tokenRepo.saveRefreshToken(user1.id, id, id, token, 5000)
			tokenRepo.saveRefreshToken(user2.id, id, id, token, 5000)
				.then(() => {
					throw new Error('was not supposed to succeed')
				})
				.catch(async (err) => {

					expect(err).to.exist

					const valid1 = await tokenRepo.isRefreshTokenValid(user1.id, id, id)
					expect(valid1).to.eq(true)
				})
		})

		it('Expiration', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]
			await tokenRepo.saveRefreshToken(user.id, id, id, token, 500)

			await sleep(500)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid).to.eq(false)
		})
	})

	describe('Invalidate token', () => {
		it('Invalidate non existing token', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.invalidateRefreshToken(user.id, id, id)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid).to.eq(false)
		})

		it('Invalidate token of non existing user', async () => {
			const id = await tokenRepo.createTokenID()

			if (typeof existingUsers[0].id === 'number') {
				await tokenRepo.invalidateRefreshToken(9999 as UserIDType, id, id)
			} else {
				await tokenRepo.invalidateRefreshToken(uuidv4() as UserIDType, id, id)
			}
		})

		it('Invalidate token with wrong family ID', async () => {
			const id = await tokenRepo.createTokenID()
			const familyId = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)

			await tokenRepo.invalidateRefreshToken(user.id, familyId, id)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid).to.eq(true)
		})

		it('Invalidate just one of 2 tokens', async () => {
			const id1 = await tokenRepo.createTokenID()
			const id2 = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.saveRefreshToken(user.id, id1, id1, token, 5000)
			await tokenRepo.saveRefreshToken(user.id, id2, id2, token, 5000)

			await tokenRepo.invalidateRefreshToken(user.id, id1, id1)

			const valid1 = await tokenRepo.isRefreshTokenValid(user.id, id1, id1)

			expect(valid1).to.eq(false)

			const valid2 = await tokenRepo.isRefreshTokenValid(user.id, id2, id2)

			expect(valid2).to.eq(true)
		})

		it('Invalidate just one of 2 tokens from same family', async () => {
			const id1 = await tokenRepo.createTokenID()
			const id2 = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.saveRefreshToken(user.id, id1, id1, token, 5000)
			await tokenRepo.saveRefreshToken(user.id, id1, id2, token, 5000)

			await tokenRepo.invalidateRefreshToken(user.id, id1, id1)

			const valid1 = await tokenRepo.isRefreshTokenValid(user.id, id1, id1)

			expect(valid1).to.eq(false)

			const valid2 = await tokenRepo.isRefreshTokenValid(user.id, id1, id2)

			expect(valid2).to.eq(true)
		})

		it('Invalidate token', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)
			const valid1 = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid1).to.eq(true)

			await tokenRepo.invalidateRefreshToken(user.id, id, id)

			const valid2 = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid2).to.eq(false)
		})
	})

	describe('Invalidate token family', () => {
		it('Invalidate non existing token', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.invalidateRefreshTokenFamily(user.id, id)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid).to.eq(false)
		})

		it('Invalidate token of non existing user', async () => {
			const id = await tokenRepo.createTokenID()

			if (typeof existingUsers[0].id === 'number') {
				await tokenRepo.invalidateRefreshTokenFamily(9999 as UserIDType, id)
			} else {
				await tokenRepo.invalidateRefreshTokenFamily(uuidv4() as UserIDType, id)
			}
		})

		it('Invalidate token with wrong family ID', async () => {
			const id = await tokenRepo.createTokenID()
			const familyId = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)

			await tokenRepo.invalidateRefreshTokenFamily(user.id, familyId)

			const valid = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid).to.eq(true)
		})

		it('Invalidate one token', async () => {
			const id = await tokenRepo.createTokenID()
			const user = existingUsers[0]

			await tokenRepo.saveRefreshToken(user.id, id, id, token, 5000)
			const valid1 = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid1).to.eq(true)

			await tokenRepo.invalidateRefreshTokenFamily(user.id, id)

			const valid2 = await tokenRepo.isRefreshTokenValid(user.id, id, id)

			expect(valid2).to.eq(false)
		})

		it('Invalidate multiple tokens from same family. Other family tokens should remain valid', async () => {
			const user = existingUsers[0]
			const familyID = await tokenRepo.createTokenID()
			const otherFamilyID = await tokenRepo.createTokenID()
			const ids = [
				await tokenRepo.createTokenID(),
				await tokenRepo.createTokenID(),
				await tokenRepo.createTokenID()
			]

			await tokenRepo.saveRefreshToken(user.id, familyID, familyID, token, 5000)
			await tokenRepo.saveRefreshToken(user.id, otherFamilyID, otherFamilyID, token, 5000)

			for(let id of ids) {
				await tokenRepo.saveRefreshToken(user.id, familyID, id, token, 5000)
			}

			for(let id of ids) {
				const valid = await tokenRepo.isRefreshTokenValid(user.id, familyID, id)

				expect(valid).to.eq(true)
			}

			await tokenRepo.invalidateRefreshTokenFamily(user.id, familyID)

			for(let id of ids) {
				const valid = await tokenRepo.isRefreshTokenValid(user.id, familyID, id)

				expect(valid).to.eq(false)
			}

			const valid = await tokenRepo.isRefreshTokenValid(user.id, familyID, familyID)

			expect(valid).to.eq(false)

			const otherValid = await tokenRepo.isRefreshTokenValid(user.id, otherFamilyID, otherFamilyID)

			expect(otherValid).to.eq(true)
		})
	})

	describe('Invalidate all user tokens', () => {
		it('Invalidate token of non existing user', async function () {
			if(!tokenRepo.invalidateUserRefreshTokens) {
				this.skip()
			}

			if (typeof existingUsers[0].id === 'number') {
				await tokenRepo.invalidateUserRefreshTokens(9999 as UserIDType)
			} else {
				await tokenRepo.invalidateUserRefreshTokens(uuidv4() as UserIDType)
			}
		})

		it('Invalidate user token', async function () {
			if(!tokenRepo.invalidateUserRefreshTokens) {
				this.skip()
			}

			const id1 = await tokenRepo.createTokenID()
			const id2 = await tokenRepo.createTokenID()
			const user1 = existingUsers[0]
			const user2 = existingUsers[1]

			await tokenRepo.saveRefreshToken(user1.id, id1, id1, token, 5000)
			await tokenRepo.saveRefreshToken(user2.id, id2, id2, token, 5000)
			let valid = await tokenRepo.isRefreshTokenValid(user1.id, id1, id1)

			expect(valid).to.eq(true)

			valid = await tokenRepo.isRefreshTokenValid(user2.id, id2, id2)

			expect(valid).to.eq(true)

			await tokenRepo.invalidateUserRefreshTokens(user1.id)

			valid = await tokenRepo.isRefreshTokenValid(user1.id, id1, id1)

			expect(valid).to.eq(false)

			valid = await tokenRepo.isRefreshTokenValid(user2.id, id2, id2)

			expect(valid).to.eq(true)
		})

		it('Invalidate multiple user tokens', async function () {
			if(!tokenRepo.invalidateUserRefreshTokens) {
				this.skip()
			}

			const familyIDs = [
				await tokenRepo.createTokenID(),
				await tokenRepo.createTokenID()
			]
			const tokenIDs = [[
				await tokenRepo.createTokenID(),
				await tokenRepo.createTokenID(),
				await tokenRepo.createTokenID(),
			], [
				await tokenRepo.createTokenID(),
				await tokenRepo.createTokenID()
			]]

			const user1 = existingUsers[0]
			const user2 = existingUsers[1]
			const otherUserTokenID = await tokenRepo.createTokenID()

			let i = 0
			for(let familyID of familyIDs) {
				// save first token (tokenID === familyID)
				await tokenRepo.saveRefreshToken(user1.id, familyID, familyID, token, 5000)

				const ids = tokenIDs[i]
				for(let tokenID of ids) {
					// save other tokens
					await tokenRepo.saveRefreshToken(user1.id, familyID, tokenID, token, 5000)
				}

				i += 1
			}

			// validate all seeded tokens
			i = 0
			for(let familyID of familyIDs) {
				const valid = await tokenRepo.isRefreshTokenValid(user1.id, familyID, familyID)

				expect(valid).to.eq(true)

				const ids = tokenIDs[i]
				for(let tokenID of ids) {
					const valid = await tokenRepo.isRefreshTokenValid(user1.id, familyID, tokenID)

					expect(valid).to.eq(true)
				}

				i += 1
			}

			// save token for other user
			await tokenRepo.saveRefreshToken(user2.id, otherUserTokenID, otherUserTokenID, token, 5000)

			// validate other user token
			let valid = await tokenRepo.isRefreshTokenValid(user2.id, otherUserTokenID, otherUserTokenID)

			expect(valid).to.eq(true)

			// invalidate all user 1 tokens
			await tokenRepo.invalidateUserRefreshTokens(user1.id)

			// validate other user token, again
			valid = await tokenRepo.isRefreshTokenValid(user2.id, otherUserTokenID, otherUserTokenID)

			expect(valid).to.eq(true)

			// validate all seeded tokens, again
			i = 0
			for(let familyID of familyIDs) {
				const valid = await tokenRepo.isRefreshTokenValid(user1.id, familyID, familyID)

				expect(valid).to.eq(false)

				const ids = tokenIDs[i]
				for(let tokenID of ids) {
					const valid = await tokenRepo.isRefreshTokenValid(user1.id, familyID, tokenID)

					expect(valid).to.eq(false)
				}

				i += 1
			}
		})
	})
}
