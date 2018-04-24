/** 
 * Enable chai expect by default.
 * http://www.andrewsouthpaw.com/2017/05/12/jest-chai-and-expect-assertions/
 */


const chai = require('chai')

// Make sure chai and jasmine ".not" play nice together
const originalNot = Object.getOwnPropertyDescriptor(chai.Assertion.prototype, 'not').get  
Object.defineProperty(chai.Assertion.prototype, 'not', {  
  get() {
    Object.assign(this, this.assignedNot)
    return originalNot.apply(this)
  },
  set(newNot) {
    this.assignedNot = newNot
    return newNot
  },
})

// Combine both jest and chai matchers on expect
const originalExpect = global.expect

global.expect = (actual) => {  
  const originalMatchers = originalExpect(actual)
  const chaiMatchers = chai.expect(actual)

  // Add middleware to Chai matchers to increment Jest assertions made
  const { assertionsMade } = originalExpect.getState()
  Object.defineProperty(chaiMatchers, 'to', {
    get() {
      originalExpect.setState({ assertionsMade: assertionsMade + 1 })
      return chai.expect(actual)
    },
  })

  const combinedMatchers = Object.assign(chaiMatchers, originalMatchers)
  return combinedMatchers
}
Object.keys(originalExpect).forEach(key => (global.expect[key] = originalExpect[key]))
