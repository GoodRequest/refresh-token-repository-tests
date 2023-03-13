module.exports = {
    exit: true,
    bail: false,
    require: ['./tests/global.ts'],
    parallel: true,
    jobs: 2,
    timeout: 30000,
	reporter: 'spec',
	spec: ['./tests/**/*.test.ts']
}
