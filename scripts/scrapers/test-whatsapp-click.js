const { chromium } = require('playwright')

const url = process.argv[2]

const LEAD_NAME = 'Carlos Mora'

const LEAD_EMAIL = 'carlos.mora.test@gmail.com'

const LEAD_PHONE = '87136969'

if (!url) {

  console.error('Usage: node scripts/scrapers/test-whatsapp-click.js URL')

  process.exit(1)

}

async function main() {

  const context = await chromium.launchPersistentContext(

    './playwright-encuentra24-session',

    { headless: false }

  )

  const page = await context.newPage()

  page.on('popup', async popup => {

    await popup.close()

  })

  await page.goto(url, {

    waitUntil: 'domcontentloaded',

    timeout: 60000

  })

  const buttons = page.getByText('WhatsApp', { exact: false })

  const count = await buttons.count()

  const whatsappNumbers = []

  console.log('WHATSAPP BUTTONS:', count)

  for (let i = 0; i < Math.min(count, 8); i++) {

    console.log('CLICKING BUTTON:', i)

    await buttons.nth(i).click()

    await page.waitForTimeout(1500)


    const modal = page.locator('[role="dialog"]').last()
    const nameInput = modal.locator('input[type="text"]').first()
    const emailInput = modal.locator('input[type="email"]').first()
    const phoneInput = modal.locator('input[type="tel"]').first()

    if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill(LEAD_NAME)
    }

    if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(LEAD_EMAIL)
    }

    if (await phoneInput.isVisible().catch(() => false)) {
    await phoneInput.fill(LEAD_PHONE)
    }



   await modal.getByText('Whatsapp', { exact: false }).last().click().catch(() => {})
        await page.waitForTimeout(2500)
        const modalText =
        await modal.innerText().catch(() => '')
        const bodyText =
        await page.locator('body').innerText()
        const match =
        modalText.match(/\+506\s?\d{4}\s?\d{4}|\+506\d{8}/) ||
        bodyText.match(/\+506\s?\d{4}\s?\d{4}|\+506\d{8}/)
        if (match) {
        const number = match[0].replace(/\s+/g, '')
        console.log('WHATSAPP:', number)
        whatsappNumbers.push({
            button: i,
            number
        })
        }
        await page.keyboard.press('Escape').catch(() => {})
        await page.waitForTimeout(800)
  }



  console.log('\n========== RESULTS ==========')
    if (whatsappNumbers.length) {
    console.table(whatsappNumbers)
    } else {
    console.log('No WhatsApp numbers found.')
    }
  await context.close()

  
}

main().catch(error => {

  console.error(error)

  process.exit(1)

})