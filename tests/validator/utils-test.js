'use strict'

const expect = require('chai').expect
const utils = require('../../lib/validator/utils')

describe('validator/utils', () => {
  describe('.validateRequiredAttribute()', () => {
    let object, result

    describe('when valid', () => {
      beforeEach(() => {
        object = {
          foo: 'bar'
        }
        result = utils.validateRequiredAttribute(object, 'path.to.object', 'foo', ['bar', 'baz'])
      })

      it('validates', () => {
        expect(result).to.eql({
          errors: [],
          warnings: []
        })
      })
    })

    describe('when attribute is missing', () => {
      beforeEach(() => {
        object = {
          bar: 'baz'
        }
        result = utils.validateRequiredAttribute(object, 'path.to.object', 'foo', ['bar', 'baz'])
      })

      it('returns appropriate error', () => {
        expect(result.errors).to.have.length(1)
        expect(result.errors).to.containSubset([{
          message: 'Missing required attribute "foo"',
          path: 'path.to.object'
        }])
      })
    })

    describe('when attribute is invalid', () => {
      beforeEach(() => {
        object = {
          foo: 'baz'
        }
        result = utils.validateRequiredAttribute(object, 'path.to.object', 'foo', ['bar'])
      })

      it('returns appropriate error', () => {
        expect(result.errors).to.containSubset([
          {path: 'path.to.object', message: 'Invalid value "baz" for "foo" Valid options are ["bar"]'}
        ])
      })
    })
  })

  describe('aggregateResults()', () => {
    let results, result
    beforeEach(() => {
      results = [
        {
          errors: [],
          warnings: ['warning-1', 'warning-2']
        },
        {
          errors: ['error-1', 'error-2'],
          warnings: []
        },
        {
          errors: [],
          warnings: ['warning-3']
        }
      ]

      result = utils.aggregateResults(results)
    })

    it('properly aggregates everything', () => {
      expect(result).to.containSubset({
        errors: ['error-1', 'error-2'],
        warnings: ['warning-1', 'warning-2', 'warning-3']
      })
    })

    it('should return only unique required errors', function () {
      results[0].errors = [{
        isRequiredError: true,
        path: '#/'
      }, {
        isRequiredError: true,
        path: '#/'
      }]

      expect(utils.aggregateResults(results)).to.eql({
        errors: [
          'error-1',
          'error-2',
          {
            isRequiredError: true,
            path: '#/'
          }
        ],
        warnings: ['warning-1', 'warning-2', 'warning-3']
      })
    })

    it('should not return required errors that is the common ancestor', function () {
      results[0].errors = [{
        isRequiredError: true,
        path: '#/a/'
      }, {
        isRequiredError: true,
        path: '#/a/b/'
      }]

      expect(utils.aggregateResults(results)).to.eql({
        errors: [
          'error-1',
          'error-2',
          {
            isRequiredError: true,
            path: '#/a/b/'
          }
        ],
        warnings: ['warning-1', 'warning-2', 'warning-3']
      })
    })

    it('should not return required errors that is the common ancestor (2)', function () {
      results[0].errors = [{
        isRequiredError: true,
        path: '#/a/b/'
      }, {
        isRequiredError: true,
        path: '#/a'
      }]

      expect(utils.aggregateResults(results)).to.eql({
        errors: [
          'error-1',
          'error-2',
          {
            isRequiredError: true,
            path: '#/a/b/'
          }
        ],
        warnings: ['warning-1', 'warning-2', 'warning-3']
      })
    })
  })
})
