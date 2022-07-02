const Escrow = artifacts.require("Escrow")

const assertError = async (promise, error) => {
    try {
        await promise
    } catch (e) {
        assert(e.message.includes(error))
        return
    }
    assert(false)
}

contract("Escrow", (accounts) => {
    const [lawyer, payer, recipient] = accounts

    let escrow
    beforeEach(async () => {
        escrow = await Escrow.new(payer, recipient, 1000, { from: lawyer })
    })

    it("Should deposit", async () => {
        await escrow.deposit({ from: payer, value: 900 })
        const escrowBalance = parseInt(await web3.eth.getBalance(escrow.address))

        assert(escrowBalance === 900)
    })

    it("Should NOT deposit if sender is not payer", async () => {
        assertError(escrow.deposit({ from: accounts[5], value: 100 }), "Sender must be the payer")
    })

    it("Should NOT deposit if transfer exceed total escrow amount", async () => {
        assertError(escrow.deposit({ from: payer, value: 1100 }), "Cant send more than escrow amount")
    })

    it("Should release funds", async () => {
        await escrow.deposit({ from: payer, value: 1000 })

        const recipientBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(recipient))
        await escrow.release({ from: lawyer })
        const recipientBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(recipient))

        assert(recipientBalanceAfter.sub(recipientBalanceBefore).toNumber() === 1000)
    })

    it("Should NOT release funds if full amount has not been received", async () => {
        await escrow.deposit({ from: payer, value: 900 })
        assertError(escrow.release({ from: lawyer }), "cannot release funds before full amount is sent")
    })

    it("Should NOT release funds if the sender is not lawyer", async () => {
        await escrow.deposit({ from: payer, value: 1000 })
        assertError(escrow.release({ from: accounts[5] }), "only lawyer can release funds")
    })
})