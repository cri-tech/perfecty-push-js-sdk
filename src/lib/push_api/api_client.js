import Logger from '../logger'
import Options from './options'
import ServiceInstaller from './service_installer'

const ApiClient = (() => {
  const register = async (userId, pushSubscription, firstTime) => {
    Logger.info('Registering user in the server')
    if (typeof firstTime === 'undefined') {
      firstTime = false
    }

    const path = `${Options.serverUrl}/v1/public/users`
    const bodyContent = JSON.stringify({
      user: pushSubscription,
      user_id: userId,
      first_time: firstTime
    })

    const body = await fetch(path, {
      method: 'post',
      headers: getHeaders(),
      body: bodyContent
    })
    const response = await body.json()
    Logger.debug('response', response)

    if (response && typeof response.uuid !== 'undefined') {
      Logger.info('The user was registered successfully')

		if (response.hasOwnProperty('subscriptions')) {
			var data=response.subscriptions;
			const abonnementsPossible = document.querySelector('.abonnements-possible');
			abonnementsPossible.innerHTML = data.map((abonnement) =>
				`<input ${abonnement.status} class="perfecty-push-settings-notifications-subscribed" id="inputNotifications${abonnement.id}" type="checkbox" value="${abonnement.id}" name="inputNotifications[${abonnement.id}]" /><label for="inputNotifications${abonnement.id}">${abonnement.title}</label><br/>`
			).join("");
		}

		var els = document.getElementsByClassName("perfecty-push-settings-notifications-subscribed");
		Array.prototype.forEach.call(els, function(el) {
			document.getElementById(el.id).onchange = async (e) => {
				const checked = e.target.checked
				optionRegister(userId,el.getAttribute('value'),e.target.checked);
			}
		});  
	  
      return response
    } else {
      Logger.error('The user could not be registered')
      return false
    }
  }

	const optionRegister = async(userId,notificationID,checked) => {
		const path = `${Options.serverUrl}/v1/public/users/${userId}/subscription`
		const pushSubscription = await ServiceInstaller.subscribeToPush()

		

		if (pushSubscription !== null) {
			const bodyContent = JSON.stringify({
			  user: pushSubscription,
			  checked: checked,
			  user_id: userId,
			  notificationID: notificationID
			})

			const body = await fetch(path, {
			  method: 'post',
			  headers: getHeaders(),
			  body: bodyContent
			})
			const response = await body.json()
			Logger.debug('response', response)
		}
	}

  const getUser = async (userId) => {
    Logger.info('Getting the registration status from the server')

    const path = `${Options.serverUrl}/v1/public/users/${userId}`

    const body = await fetch(path, {
      method: 'get',
      headers: getHeaders()
    })
    if (body.ok) {
      const user = await body.json()
      Logger.debug('response', user)

      if (user && typeof user.uuid !== 'undefined') {
		  
		if (user.hasOwnProperty('subscriptions')) {
			var data=user.subscriptions;
			const abonnementsPossible = document.querySelector('.abonnements-possible');
			abonnementsPossible.innerHTML = data.map((abonnement) =>
				`<input ${abonnement.status} class="perfecty-push-settings-notifications-subscribed" id="inputNotifications${abonnement.id}" type="checkbox" value="${abonnement.id}" name="inputNotifications[${abonnement.id}]" /><label for="inputNotifications${abonnement.id}">${abonnement.title}</label><br/>`
			).join("");

			var els = document.getElementsByClassName("perfecty-push-settings-notifications-subscribed");
			Array.prototype.forEach.call(els, function(el) {
				document.getElementById(el.id).onchange = async (e) => {
					const checked = e.target.checked
					optionRegister(userId,el.getAttribute('value'),e.target.checked);
				}
			});  
		} 
        Logger.info('The user was found')
        return user
      } else {
        Logger.info('The user was not found')
        return null
      }
    } else {
      Logger.debug('response', body)
      throw new Error('Could not communicate with the server')
    }
  }

  const unregister = async (userId) => {
    Logger.info('Unregistering user in the server')
    Logger.debug(`User: ${userId}`)

    const path = `${Options.serverUrl}/v1/public/users/${userId}/unregister`

    let response
    try {
      const body = await fetch(path, {
        method: 'post',
        headers: getHeaders()
      })
      response = await body.json()
      Logger.debug('response', response)
    } catch (e) {
      Logger.error('Could not execute the fetch operation', e)
    }

    if (response && typeof response.result !== 'undefined') {
      Logger.info('The user was unregistered')
      return true
    } else {
      Logger.info('The user could not be unregistered')
      return false
    }
  }

  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json'
    }
    headers[Options.tokenHeader] = Options.token
    return headers
  }

  return {
    register,
    unregister,
    getUser
  }
})()

export default ApiClient
