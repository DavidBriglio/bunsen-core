var expect = require('chai').expect

const stuff = require('../lib/normalize-model-and-view')
const deepFreeze = require('./deep-freeze')
const {BunsenModelPath} = require('../lib/utils')

describe('normalize model and view', function () {
  describe('addBunsenModelProperty()', () => {
    var model

    beforeEach(() => {
      model = deepFreeze({
        properties: {
          bar: {
            properties: {
              baz: {
                type: 'string'
              }
            },
            type: 'object'
          },
          foo: {
            type: 'string'
          }
        },
        type: 'object'
      })
    })

    it('adds top level property that is not present', () => {
      const partial = {type: 'number'}
      const actual = stuff.addBunsenModelProperty(model, partial, 'properties.jazzHands')

      expect(actual).to.eql({
        properties: {
          bar: {
            properties: {
              baz: {
                type: 'string'
              }
            },
            type: 'object'
          },
          foo: {
            type: 'string'
          },
          jazzHands: {
            type: 'number'
          }
        },
        type: 'object'
      })
    })

    it('adds nested property that is not present', () => {
      const partial = {type: 'number'}
      const actual = stuff.addBunsenModelProperty(model, partial, 'properties.bar.properties.jazzHands')

      expect(actual).to.eql({
        properties: {
          bar: {
            properties: {
              baz: {
                type: 'string'
              },
              jazzHands: {
                type: 'number'
              }
            },
            type: 'object'
          },
          foo: {
            type: 'string'
          }
        },
        type: 'object'
      })
    })

    it('adds nested property and parent when not present', () => {
      const partial = {type: 'number'}
      const actual = stuff.addBunsenModelProperty(model, partial, 'properties.spam.properties.jazzHands')

      expect(actual).to.eql({
        properties: {
          bar: {
            properties: {
              baz: {
                type: 'string'
              }
            },
            type: 'object'
          },
          foo: {
            type: 'string'
          },
          spam: {
            properties: {
              jazzHands: {
                type: 'number'
              }
            },
            type: 'object'
          }
        },
        type: 'object'
      })
    })
    it('overwriting an existing model', () => {
      const partial = {type: 'number'}
      const actual = stuff.addBunsenModelProperty(model, partial, 'properties.bar.properties.baz')

      expect(actual).to.eql({
        properties: {
          bar: {
            properties: {
              baz: {
                type: 'number'
              }
            },
            type: 'object'
          },
          foo: {
            type: 'string'
          }
        },
        type: 'object'
      })
    })
  })

  describe('normalizeCell()', () => {
    it('normalizes cell without children', () => {
      const cell = deepFreeze({
        id: 'test',
        model: {
          type: 'number'
        }
      })

      const actual = stuff.normalizeCell(cell, {})

      expect(actual).to.eql({
        id: 'test',
        model: 'test'
      })
    })

    it('normalizes internal cell without children', () => {
      const cell = deepFreeze({
        id: 'test',
        internal: true,
        model: {
          type: 'number'
        }
      })
      const actual = stuff.normalizeCell(cell, {})

      expect(actual).to.eql({
        id: 'test',
        internal: true,
        model: '_internal.test'
      })
    })

    it('normalizes cell with children', () => {
      const cell = deepFreeze({
        children: [
          {
            model: 'foo'
          },
          {
            model: 'bar'
          }
        ],
        id: 'test',
        model: {
          properties: {
            bar: {
              type: 'number'
            },
            foo: {
              type: 'string'
            }
          },
          type: 'object'
        }
      })

      const actual = stuff.normalizeCell(cell, {})

      expect(actual).to.eql({
        children: [
          {
            model: 'foo'
          },
          {
            model: 'bar'
          }
        ],
        id: 'test',
        model: 'test'
      })
    })

    it('normalizes internal cell with children', () => {
      const cell = deepFreeze({
        children: [
          {
            model: 'foo'
          },
          {
            model: 'bar'
          }
        ],
        id: 'test',
        internal: true,
        model: {
          properties: {
            bar: {
              type: 'number'
            },
            foo: {
              type: 'string'
            }
          },
          type: 'object'
        }
      })

      const actual = stuff.normalizeCell(cell, {})

      expect(actual).to.eql({
        children: [
          {
            model: 'foo'
          },
          {
            model: 'bar'
          }
        ],
        id: 'test',
        internal: true,
        model: '_internal.test'
      })
    })

    it('normalizes internal cell with nested children', () => {
      const cell = deepFreeze({
        children: [
          {
            children: [
              {
                model: 'bar'
              },
              {
                model: 'baz'
              }
            ],
            model: 'foo'
          }
        ],
        id: 'test',
        internal: true,
        model: {
          properties: {
            foo: {
              properties: {
                bar: {
                  type: 'number'
                },
                baz: {
                  type: 'string'
                }
              },
              type: 'object'
            }
          },
          type: 'object'
        }
      })

      const actual = stuff.normalizeCell(cell, {})

      expect(actual).to.eql({
        children: [{
          children: [
            {
              model: 'bar'
            },
            {
              model: 'baz'
            }
          ],
          model: 'foo'
        }],
        model: '_internal.test',
        internal: true,
        id: 'test'
      })
    })

    it('normalizes nested cell without children', () => {
      const cell = deepFreeze({
        children: [
          {
            children: [
              {
                id: 'foo',
                model: {
                  type: 'string'
                }
              }
            ]
          }
        ]
      })

      const actual = stuff.normalizeCell(cell, {})

      expect(actual).to.eql({
        children: [
          {
            children: [
              {
                id: 'foo',
                model: 'foo'
              }
            ]
          }
        ]
      })
    })

    it('normalizes nested sibling cells without children', () => {
      const cell = deepFreeze({
        children: [
          {
            model: 'test'
          },
          {
            children: [
              {
                id: 'foo',
                model: {
                  type: 'string'
                }
              },
              {
                id: 'bar',
                model: {
                  type: 'string'
                }
              }
            ]
          }
        ]
      })

      const actual = stuff.normalizeCell(cell, {})

      expect(actual).to.eql({
        children: [
          {
            model: 'test'
          },
          {
            children: [
              {
                model: 'foo',
                id: 'foo'
              },
              {
                model: 'bar',
                id: 'bar'
              }
            ]
          }
        ]
      })
    })
  })

  describe('pluckModels', () => {
    it('should add object models including extended cell definitions', () => {
      const bunsenModel = {
        properties: {
          properties: {
            properties: {
              l1ServiceEndPointList: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    node: {
                      type: 'string',
                      title: 'Node'
                    },
                    port: {
                      type: 'string',
                      title: 'Port'
                    }
                  },
                  required: [
                    'node',
                    'port'
                  ]
                }
              }
            },
            type: 'object',
            required: [
              'l1ServiceEndPointList'
            ]
          }
        },
        type: 'object',
        required: [
          'properties'
        ]
      }
      const cell = {
        children: [
          {
            id: 'properties.l1ServiceEndPointList',
            extends: 'endPoints',
            model: {
              type: 'array',
              title: 'Endpoints',
              minItems: 2,
              items: {
                type: 'object',
                properties: {
                  node: {
                    type: 'string',
                    title: 'Node'
                  },
                  port: {
                    type: 'string',
                    title: 'Port'
                  }
                },
                required: [
                  'node',
                  'port'
                ]
              }
            }
          }
        ]
      }
      const modelPath = new BunsenModelPath(bunsenModel)
      const cellDefinitions = {
        endPoints: {
          children: [
            {
              classNames: {
                cell: 'one-half'
              },
              model: '0',
              label: 'A-end',
              extends: 'endPoint'
            },
            {
              classNames: {
                cell: 'one-half'
              },
              model: '1',
              label: 'Z-end',
              extends: 'endPoint'
            }
          ]
        },
        endPoint: {
          children: [
            {
              id: 'domainId',
              internal: true,
              model: {
                type: 'string'
              },
              label: 'Domain',
              placeholder: 'Select a domain ...'
            },
            {
              model: 'node',
              label: 'Node',
              placeholder: 'Select a node ...'
            },
            {
              model: 'port',
              label: 'Port',
              placeholder: 'Select a port ...'
            }
          ]
        }
      }
      let models = {}
      stuff.pluckModels(cell, modelPath, models, cellDefinitions)
      expect(models).to.eql({
        'properties.properties.properties.l1ServiceEndPointList': cell.children[0].model,
        'properties.properties.properties.l1ServiceEndPointList.items.properties._internal.properties.domainId': {
          type: 'string'
        }
      })
    })
  })

  it('normalizeCells() normalizes various types of cells', () => {
    const view = deepFreeze({
      cells: [
        {
          model: 'foo'
        },
        {
          id: 'alpha',
          model: {
            type: 'boolean'
          }
        },
        {
          id: 'bravo',
          internal: true,
          model: {
            type: 'number'
          }
        },
        {
          children: [
            {
              id: 'charlie',
              model: {
                type: 'string'
              }
            },
            {
              id: 'delta',
              internal: true,
              model: {
                type: 'number'
              }
            }
          ],
          label: 'Test'
        }
      ],
      type: 'form',
      version: '2.0'
    })

    const actual = stuff.normalizeCells(view)

    expect(actual).to.eql({
      cells: [
        {
          model: 'foo'
        },
        {
          id: 'alpha',
          model: 'alpha'
        },
        {
          id: 'bravo',
          internal: true,
          model: '_internal.bravo'
        },
        {
          children: [
            {
              id: 'charlie',
              model: 'charlie'
            },
            {
              id: 'delta',
              internal: true,
              model: '_internal.delta'
            }
          ],
          label: 'Test'
        }
      ],
      type: 'form',
      version: '2.0'
    })
  })

  it('normalizeChildren() normalizes children', () => {
    const cell = deepFreeze({
      children: [
        {
          id: 'bar',
          model: {
            type: 'number'
          }
        }
      ],
      label: 'Test'
    })

    const actual = stuff.normalizeChildren(cell, {})

    expect(actual).to.eql([{
      id: 'bar',
      model: 'bar'
    }])
  })

  it('default export normalizes everything', () => {
    const state = deepFreeze({
      model: {
        properties: {
          //
        },
        type: 'object'
      },
      view: {
        cellDefinitions: {
          main: {
            id: 'foo',
            model: {
              type: 'string'
            }
          }
        },
        cells: [
          {
            extends: 'main'
          },
          {
            id: 'bar',
            model: {
              type: 'number'
            }
          }
        ],
        type: 'form',
        version: '2.0'
      }
    })

    const actual = stuff.default(state)

    expect(actual).to.eql({
      model: {
        properties: {
          bar: {
            type: 'number'
          },
          foo: {
            type: 'string'
          }
        },
        type: 'object'
      },
      view: {
        cellDefinitions: {
          main: {
            id: 'foo',
            model: {
              type: 'string'
            }
          }
        },
        cells: [
          {
            id: 'foo',
            model: 'foo'
          },
          {
            id: 'bar',
            model: 'bar'
          }
        ],
        type: 'form',
        version: '2.0'
      }
    })
  })
  it('default export returns model and view unchanged when non-existing cell definition is extended', () => {
    const model = {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        }
      }
    }
    const view = {
      cellDefinitions: {
      },
      cells: [
        {
          model: 'foo',
          extends: 'bar'
        }
      ],
      type: 'form',
      version: '2.0'
    }

    const normalized = stuff.default({view, model})

    expect(normalized.model).to.be.equal(model)
    expect(normalized.view).to.be.equal(view)
  })

  it('default export returns model and view unchanged when extended cell is bad', () => {
    const model = {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        }
      }
    }
    const view = {
      cellDefinitions: {
        bar: 'baz'
      },
      cells: [
        {
          model: 'foo',
          extends: 'bar'
        }
      ],
      type: 'form',
      version: '2.0'
    }
    const normalized = stuff.default({view, model})

    expect(normalized.model).to.be.equal(model)
    expect(normalized.view).to.be.equal(view)
  })
})

describe('normalizes complex cases', function () {
  var model
  var view
  beforeEach(function () {
    model = {
      type: 'object',
      properties: {
        blix: {
          type: 'object',
          properties: {}
        },
        foo: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bar: {
                type: 'string'
              }
            }
          }
        }
      }
    }
    view = {
      type: 'form',
      version: '2.0',
      cells: [{
        model: 'foo',
        arrayOptions: {
          itemCell: {
            children: [{
              extends: 'baz'
            }, {
              extends: 'quux'
            }, {
              model: 'bar'
            }]
          }
        }
      },
      {
        id: 'bawla',
        model: {
          type: 'string'
        },
        internal: true
      },
      {
        model: 'blix',
        children: [{
          id: 'blap',
          internal: true,
          model: {
            type: 'string'
          }
        }]
      }],
      cellDefinitions: {
        baz: {
          id: 'baz',
          model: {
            type: 'boolean'
          },
          internal: true
        },
        quux: {
          id: 'quux',
          model: {
            type: 'number'
          },
          internal: false
        }
      }
    }
  })

  it('by adding to model', function () {
    const newState = stuff.default({model, view})
    const newModel = newState.model
    expect(newModel).to.be.eql({
      type: 'object',
      properties: {
        _internal: {
          type: 'object',
          properties: {
            bawla: {
              type: 'string'
            }
          }
        },
        blix: {
          type: 'object',
          properties: {
            _internal: {
              type: 'object',
              properties: {
                blap: {
                  type: 'string'
                }
              }
            }
          }
        },
        foo: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bar: {
                type: 'string'
              },
              quux: {
                type: 'number'
              },
              _internal: {
                type: 'object',
                properties: {
                  baz: {
                    type: 'boolean'
                  }
                }
              }
            }
          }
        }
      }
    })
  })

  it('by replacing model objects in views with strings', function () {
    const newState = stuff.default({model, view})
    const newView = newState.view
    expect(newView).to.be.eql({
      type: 'form',
      version: '2.0',
      cells: [{
        model: 'foo',
        arrayOptions: {
          itemCell: {
            children: [{
              id: 'baz',
              internal: true,
              model: '_internal.baz'
            }, {
              id: 'quux',
              internal: false,
              model: 'quux'
            }, {
              model: 'bar'
            }]
          }
        }
      },
      {
        id: 'bawla',
        internal: true,
        model: '_internal.bawla'
      },
      {
        children: [
          {
            id: 'blap',
            internal: true,
            model: '_internal.blap'
          }
        ],
        model: 'blix'
      }],
      cellDefinitions: {
        baz: {
          id: 'baz',
          model: {
            type: 'boolean'
          },
          internal: true
        },
        quux: {
          id: 'quux',
          model: {
            type: 'number'
          },
          internal: false
        }
      }
    })
  })
})
