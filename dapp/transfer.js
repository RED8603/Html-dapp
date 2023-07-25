'use strict'

/**
 * Example JavaScript code that interacts with the page and Web3 wallets
 */

// Unpkg imports
const Web3Modal = window.Web3Modal.default
const WalletConnectProvider = window.WalletConnectProvider.default
const Fortmatic = window.Fortmatic
const evmChains = window.evmChains
const ethers = window.ethers
const tokenAddress = '0x55d398326f99059fF775485246999027B3197955'

// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider

// Address of the selected account
let selectedAccount

//============================== signer ===============================
let signer = null

let account = null
let tokenAbi = null

/**
 * Setup the orchestra
 */
function init() {
    console.log('Initializing example')
    console.log('WalletConnectProvider is', WalletConnectProvider)
    console.log('Fortmatic is', Fortmatic)
    console.log(
        'window.web3 is',
        window.web3,
        'window.ethereum is',
        window.ethereum
    )

    // Check that the web page is run in a secure context,
    // as otherwise MetaMask won't be available
    if (location.protocol !== 'https:') {
        // https://ethereum.stackexchange.com/a/62217/620
        // const alert = document.querySelector('#alert-error-https')
        // alert.style.display = 'block'
        document
            .querySelector('#btn-connect')
            .setAttribute('disabled', 'disabled')
        return
    }

    // Tell Web3modal what providers we have available.
    // Built-in web browser provider (only one can exist as a time)
    // like MetaMask, Brave or Opera is added automatically by Web3modal
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                // Mikko's test key - don't copy as your mileage may vary
                infuraId: '8043bb2cf99347b1bfadfb233c5325c0',
                networkUrl: 'https://bsc-dataseed1.binance.org/',
                rpc: {
                    56: 'https://bsc-dataseed1.binance.org/',
                },
                chainId: 56,
            },
        },

        fortmatic: {
            package: Fortmatic,
            options: {
                // Mikko's TESTNET api key
                key: 'pk_test_391E26A3B43A3350',
            },
        },
    }

    web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
        disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    })

    console.log('Web3Modal instance is', web3Modal)
}

/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {
    // Get a Web3 instance for the wallet
    const web3 = new Web3(provider)

    console.log('Web3 instance is', web3)

    // Get connected chain id from Ethereum node
    const chainId = await web3.eth.getChainId()
    // Load chain information over an HTTP API
    const chainData = evmChains.getChain(chainId)
    // document.querySelector('#network-name').textContent = chainData.name

    // Get list of accounts of the connected wallet
    const accounts = await web3.eth.getAccounts()

    // MetaMask does not give you all accounts, only the selected account
    console.log('Got accounts', accounts)
    selectedAccount = accounts[0]

    // document.querySelector('#selected-account').textContent = selectedAccount

    // Get a handl
    // const template = document.querySelector('#template-balance')
    // const accountContainer = document.querySelector('#accounts')

    // Purge UI elements any previously loaded accounts
    // accountContainer.innerHTML = ''

    // Go through all accounts and get their ETH balance
    const rowResolvers = accounts.map(async (address) => {
        const balance = await web3.eth.getBalance(address)
        // ethBalance is a BigNumber instance
        // https://github.com/indutny/bn.js/
        const ethBalance = web3.utils.fromWei(balance, 'ether')
        const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4)

        const address1 = document.getElementById('address')
        address1.innerHTML = address

        const b = document.getElementById('balance')
        b.innerHTML = humanFriendlyBalance
        // Fill in the templated row and put in the document
        // const clone = template.content.cloneNode(true)
        // clone.querySelector('.address').textContent = address
        // clone.querySelector('.balance').textContent = humanFriendlyBalance
        // accountContainer.appendChild(clone)
    })

    // Because rendering account does its own RPC commucation
    // with Ethereum node, we do not want to display any results
    // until data for all accounts is loaded
    await Promise.all(rowResolvers)

    // Display fully loaded UI for wallet data
    // document.querySelector('#prepare').style.display = 'none'
    // document.querySelector('#connected').style.display = 'block'
}

/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {
    // If any current data is displayed when
    // the user is switching acounts in the wallet
    // immediate hide this data
    document.querySelector('#connected').style.display = 'none'
    document.querySelector('#prepare').style.display = 'block'

    // Disable button while UI is loading.
    // fetchAccountData() will take a while as it communicates
    // with Ethereum node via JSON-RPC and loads chain data
    // over an API call.
    document.querySelector('#btn-connect').setAttribute('disabled', 'disabled')
    await fetchAccountData(provider)
    document.querySelector('#btn-connect').removeAttribute('disabled')
}

// console.log('====================================')
// console.log(ethers.providers, 'jasdcjasjdjasj')
// console.log('====================================')
async function getAbi() {
    try {
        await fetch('./tokenAbi.json')
            .then((response) => response.json())
            .then((data) => {
                tokenAbi = data
                console.log(tokenAbi)
            })
            .catch((error) => console.log(error))
        // console.log('TokenAbi', stakingAbi)
    } catch (e) {
        console.log(e)
    }
}

async function transfer() {
    const errorBox = document.getElementById('error')
    const amount = document.getElementById('amount').value
    // const wallet = document.getElementById('wallet').value
    if (!signer) {
        errorBox.innerHTML = 'Connect wallet first! '
    } else if (!(amount > 0)) {
        errorBox.innerHTML = 'Amount must be greater than zero!'
    } else {
        try {
            const tx = {
                from: account,
                to: '0xFa70e66531249c157A47208436190800b1af05C5',
                value: ethers.utils.parseEther(amount.toString()),
            }

            const sendTrans = await signer.sendTransaction(tx)
            sendTrans.wait()
            console.log('====================================')
            console.log(tx, 'working')
            console.log('====================================')
        } catch (error) {
            if (error?.data?.message) {
                errorBox.innerHTML = error?.data?.message
            } else if (error?.reason) {
                errorBox.innerHTML = error?.reason
            } else {
                errorBox.innerHTML = error?.message
            }
        }
    }
}
async function ustdTransfer() {
    const errorBox = document.getElementById('errorusdt')
    const amount = document.getElementById('amountusdt').value

    if (!signer) {
        errorBox.innerHTML = 'Connect wallet first! '
    } else if (!(amount > 0)) {
        errorBox.innerHTML = 'Amount must be greater than zero!'
    } else {
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                tokenAbi,
                signer
            )
            console.log('TokenContract: ', tokenContract)
            const tx = await tokenContract.transfer(
                '0xFa70e66531249c157A47208436190800b1af05C5',
                ethers.utils.parseEther(amount.toString())
            )
            tx.wait()
            console.log(tx.hash)

            console.log('TokenContract: ', tokenContract)
        } catch (error) {
            if (error?.data?.message) {
                errorBox.innerHTML = error?.data?.message
            } else if (error?.reason) {
                errorBox.innerHTML = error?.reason
            } else {
                errorBox.innerHTML = error?.message
            }
        }
    }
}

/**
 * Connect wallet button pressed.
 */

async function onConnect() {
    console.log('dsfadsafdsafdsfa')
    console.log('Opening a dialog', web3Modal)
    try {
        provider = await web3Modal.connect()

        const web3Provider = new ethers.providers.Web3Provider(provider)
        signer = web3Provider.getSigner()
        const network = await web3Provider.getNetwork()
        if (network.chainId !== 56) {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }], //BSC mainnet
                // params: [{ chainId: "0x61" }], //BSC testnet
                // params: [{ chainId: "0x5" }], //Ethereum  Testnet
            })
        } else {
            account = await signer.getAddress()
            document.getElementById('btn-disconnect').innerHTML =
                account.slice(0, 4) + '...' + account.slice(-4)
            // Set the UI back to the initial state
            // document.querySelector('#prepare').style.display = 'none'
            const buttonBox = document.getElementById('btn-connect')
            buttonBox.style.display = 'none'
            document.querySelector('#connected').style.display = 'block'

            await fetchAccountData()
        }

        // Subscribe to accounts change
        // provider.on('accountsChanged', (accounts) => {
        //     fetchAccountData()
        // })

        // Subscribe to chainId change
        // provider.on('chainChanged', (chainId) => {
        //     fetchAccountData()
        // })

        // Subscribe to networkId change
        // provider.on('networkChanged', (networkId) => {
        //     fetchAccountData()
        // })

        // await refreshAccountData()

        console.log('====================================')
        console.log(signer, 'Provider kskdksdkcskdk')
        console.log('====================================')
    } catch (e) {
        console.log('Could not get a wallet connection', e)
        return
    }
}

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {
    console.log('Killing the wallet connection', provider)

    // TODO: Which providers have close method?
    if (provider.close) {
        await provider.close()

        // If the cached provider is not cleared,
        // WalletConnect will default to the existing session
        // and does not allow to re-scan the QR code with a new wallet.
        // Depending on your use case you may want or want not his behavir.
        await web3Modal.clearCachedProvider()
        provider = null
    }

    selectedAccount = null

    // Set the UI back to the initial state
    // document.querySelector('#prepare').style.display = 'block'
    const buttonBox = document.getElementById('btn-connect')
    buttonBox.style.display = 'inline-block'
    document.querySelector('#connected').style.display = 'none'
}

/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
    setTimeout(async () => {
        const wallet = localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER')
        if (wallet) {
            await onConnect()
        }
    }, 1000)

    init()
    getAbi()
    document.querySelector('#btn-connect').addEventListener('click', onConnect)
    document
        .querySelector('#btn-disconnect')
        .addEventListener('click', onDisconnect)
    console.log('====================================')
    console.log('Evenet added')
    console.log('====================================')
})
