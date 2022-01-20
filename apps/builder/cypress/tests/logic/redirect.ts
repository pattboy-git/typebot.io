import { preventUserFromRefreshing } from 'cypress/plugins/utils'
import { getIframeBody } from 'cypress/support'

describe('Redirect', () => {
  beforeEach(() => {
    cy.task('seed')
    cy.signOut()
  })

  afterEach(() => {
    cy.window().then((win) => {
      win.removeEventListener('beforeunload', preventUserFromRefreshing)
    })
  })

  it('should redirect to URL correctly', () => {
    cy.loadTypebotFixtureInDatabase('typebots/logic/redirect.json')
    cy.signIn('test2@gmail.com')
    cy.visit('/typebots/typebot4/edit')
    cy.findByText('Configure...').click()
    cy.findByPlaceholderText('Type a URL...').type('google.com')

    cy.findByRole('button', { name: 'Preview' }).click()
    getIframeBody().findByRole('button', { name: 'Go to URL' }).click()
    cy.url().should('eq', 'https://www.google.com/')

    cy.go('back')

    cy.window().then((win) => {
      cy.stub(win, 'open').as('open')
    })
    cy.findByText('Redirect to google.com').click()
    cy.findByRole('checkbox', { name: 'Open in new tab?' }).check({
      force: true,
    })

    cy.findByRole('button', { name: 'Preview' }).click()
    getIframeBody().findByRole('button', { name: 'Go to URL' }).click()
    cy.get('@open').should(
      'have.been.calledOnceWithExactly',
      'https://google.com',
      '_blank'
    )
  })
})
