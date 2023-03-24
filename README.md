# Refresh Token Repository Tests
Test for Refresh Token Repository implementations. Refresh Token Repository interface is specified in [passport-jwt-wrapper](https://www.npmjs.com/package/@goodrequest/passport-jwt-wrapper) library.

## Installation
`npm i --save-dev git@github.com:GoodRequest/refresh-token-repository-tests.git`

## Usage
In `*.test.ts`:
```typescript
import { declareRefreshTokenRepositoryTests, ITestUser } from '@goodrequest/refresh-token-repository-tests'

describe('UUID Refresh tokens', () => {
	const tokenRepo = new RefreshTokenRepository(models.UUIDUserToken)
	const existingUsers: ITestUser<string>[] = []

	before(async () => {
		const hash = await createHash(password)

		const mappedData = userData.map((data) => ({
			email: data.email,
			confirmedAt: data.isConfirmed ? Date.now() : null,
			hash: data.isConfirmed ? hash : null,
		}))

		const seedUsers = await UserModel.bulkCreate(mappedData)
		existingUsers.push(...seedUsers)
	})

	declareRefreshTokenRepositoryTests(tokenRepo, existingUsers)
})
```
