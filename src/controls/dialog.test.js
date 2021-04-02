import 'regenerator-runtime/runtime'
import Options from '../lib/push_api/options'
import Permission from '../lib/push_api/permission'
import Storage from '../lib/push_api/storage'
import Registration from '../lib/push_api/registration'
import DialogControl from './dialog'

jest.mock('../lib/push_api/permission', () => ({
  hasNeverAsked: jest.fn().mockImplementation(() => true),
  isGranted: jest.fn().mockImplementation(() => true),
  askIfNotDenied: jest.fn().mockReturnValueOnce('granted')
}))
jest.mock('../lib/push_api/storage', () => {
  return jest.fn().mockImplementation(() => {
    return {
      hasAskedNotifications: () => { return false }
    }
  })
})
jest.mock('../lib/push_api/registration')

describe('when the dialog is created', () => {
  beforeEach(() => {
    Permission.hasNeverAsked.mockClear()
    Permission.isGranted.mockClear()
    Permission.askIfNotDenied.mockClear()
    Storage.mockClear()
    Registration.mockClear()
    document.body.innerHTML = ''
  })

  it('is drawn and hidden if already subscribed', () => {
    Permission.hasNeverAsked.mockImplementationOnce(() => false)

    const options = new Options()
    const dialog = new DialogControl(options)
    dialog.draw()

    const expectedHTML = '<div class="site perfecty-push-dialog-container" id="perfecty-push-dialog-container" style="display: none;">  <div class="perfecty-push-dialog-box">    <div class="perfecty-push-dialog-title">Do you want to receive notifications?</div>    <div class="perfecty-push-dialog-buttons">      <button id="perfecty-push-dialog-cancel" type="button" class="button secondary">Not now</button>      <button id="perfecty-push-dialog-subscribe" type="button" class="button primary">Continue</button>     </div>  </div></div>'
    expect(document.body.innerHTML).toEqual(expectedHTML)
    expect(isShown()).toEqual(false)
  })

  it('is shown to unsubscribed users', () => {
    const options = new Options()
    const dialog = new DialogControl(options)
    dialog.draw()

    expect(isShown()).toEqual(true)
  })

  it('is hidden to unsubscribed users and already asked to subscribe', () => {
    Storage.mockImplementationOnce(() => {
      return {
        hasAskedNotifications: () => { return true }
      }
    })

    const options = new Options()
    const dialog = new DialogControl(options)
    dialog.draw()

    expect(isShown()).toEqual(false)
  })

  it('hides when cancel is clicked', async () => {
    const mockSetHasAskedNotifications = jest.fn().mockReturnValueOnce(true)
    Storage.mockImplementationOnce(() => {
      return {
        hasAskedNotifications: () => { return false },
        setHasAskedNotifications: mockSetHasAskedNotifications
      }
    })

    const options = new Options()
    const dialog = new DialogControl(options)
    dialog.draw()

    expect(isShown()).toEqual(true)
    await simulateClickOnCancel()
    expect(isShown()).toEqual(false)
    expect(mockSetHasAskedNotifications).toHaveBeenCalledTimes(1)
  })

  it('register user when subscribe is clicked and permission is granted', async () => {
    const mockSetHasAskedNotifications = jest.fn().mockReturnValueOnce(true)
    Storage.mockImplementationOnce(() => {
      return {
        hasAskedNotifications: () => { return false },
        setHasAskedNotifications: mockSetHasAskedNotifications
      }
    })

    const options = new Options()
    const dialog = new DialogControl(options)
    dialog.draw()

    const registrationInstance = Registration.mock.instances[0]

    expect(isShown()).toEqual(true)
    await simulateClickOnSubscribe()
    expect(isShown()).toEqual(false)
    expect(mockSetHasAskedNotifications).toHaveBeenCalledTimes(1)
    expect(Permission.askIfNotDenied).toHaveBeenCalledTimes(1)
    expect(registrationInstance.register).toHaveBeenCalledTimes(1)
  })
})

function isShown () {
  const control = document.getElementById('perfecty-push-dialog-container')
  return control.style.display !== 'none'
}

function simulateClickOnCancel () {
  const control = document.getElementById('perfecty-push-dialog-cancel')
  control.click()

  return tick()
}

function simulateClickOnSubscribe () {
  const control = document.getElementById('perfecty-push-dialog-subscribe')
  control.click()

  return tick()
}

function tick () {
  // wait for the next macrotask
  // useful when we're waiting for the click event to be processed
  // https://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}
