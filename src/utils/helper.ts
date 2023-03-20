import slugify from 'slugify'

/**
 * Creates slug form from value
 * @param {string} value
 * @param {string} [separator='-']
 * @returns {string} slug form if value is provided, else empty string
 */
export function createSlug(value?: string, separator = '-'): string {
	if (value) {
		return slugify(value, {
			replacement: separator,
			remove: undefined,
			lower: true
		})
	}

	return ''
}
