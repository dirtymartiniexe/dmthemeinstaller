import chalk from "chalk"
import inquirer from "inquirer"
import figlet from "figlet"
import boxen from "boxen"
import { createSpinner } from "nanospinner"

import os from "os"
import process from "process"
import nodegit from "nodegit"
import path from "path"
import { URL } from "url"
// import fs from 'fs-extra'

let themeName
let proxyName

// UTILITY FUNCTIONS

// artificial delay
const sleep = (ms = 1500) => new Promise((r) => setTimeout(r, ms))

//function to listen to keypress
const keypress = async () => {
  process.stdin.setRawMode(true)
  return new Promise((resolve) =>
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false)
      resolve()
    })
  )
}

async function handleAnswer() {
  const spinner = createSpinner("Processing...").start()
  await sleep()
  spinner.success()
}

// DM THEME INSTALLER

// 1. Welcome a new user
async function welcome() {
  figlet.text("DMTHEME", { font: "Standard" }, function (err, data) {
    console.log(data)
    figlet.text("INSTALLER", { font: "Standard" }, function (err, data) {
      console.log(data)
      console.log("Let's get this party started!")
      console.log("Press any key to continue...")
    })
  })

  await keypress()
}

async function disclaimer() {
  console.clear()

  console.log(
    boxen(
      `In order for the DMTheme installer to run you first need to open ${chalk.magenta.underline.bold(
        "WP Local"
      )}. \n Create a new site and wait for provisioning to be completed. \n (This might include entering a password!)`,
      {
        title: "DISCLAIMER",
        titleAlignment: "center",
        borderStyle: "classic",
        padding: 1,
        margin: 1,
      }
    )
  )
  console.log("Press any key to continue...")

  await keypress()
}

async function StoreVariables() {
  console.clear()

  const variables = await inquirer
    .prompt([
      {
        name: "theme_name",
        type: "input",
        message: `What’s the NEW WP Local ${chalk.magenta.underline.bold(
          "site name"
        )} ?`,
        validate(answer) {
          // if no answer or answer has space or the site name includes .local in it question will display error
          if (!answer || /\s/g.test(answer) || answer.includes(".local")) {
            return "Please type the site name, make sure its one word"
          }
          return true
        },
      },
      {
        name: "proxy_name",
        type: "input",
        message: `What is the ${chalk.green.underline.bold("proxy?")}`,
        default(answers) {
          return `${answers.theme_name}.local`
        },
        validate(answer) {
          if (!answer.includes(".local")) {
            return "Proxy does not contain .local, please try again"
          }
          return true
        },
      },
    ])
    .then((answers) => {
      themeName = answers.theme_name
      proxyName = answers.proxy_name
    })

  return handleAnswer()
}

async function readyDownload() {
  //  console.log(themeName, proxyName)

  // Ready to download?

  const readyToDownload = await inquirer
    .prompt({
      name: "ready",
      type: "confirm",
      message: `Ready to download`,
    })
    .then((answers) => {
      if (answers.ready) {
        // navigate to local sites folder
        // cd 'Users/maxkirwin/Local Sites/{var:first}/app/public/wp-content/themes'
        //`/Local Sites/${themeName}/app/public/wp-content/themes`

        const directory = `${os.homedir()}/Local Sites/${themeName}/app/public/wp-content/themes`

        try {
          // Change the directory
          process.chdir(directory)
          console.log("New directory: " + process.cwd())

          // download git repo
          const url = "git@github.com:dirtymartiniexe/DMThemev4.git"
          const cloneOpts = {
            fetchOpts: {
              callbacks: {
                certificateCheck: () => 1,
                credentials: (url, username) => {
                  if (authAttempted) return nodegit.Cred.defaultNew()
                  authAttempted = true
                  if (url.startsWith("https://") && url.includes("@")) {
                    url = new URL(url)
                    return nodegit.Cred.userpassPlaintextNew(
                      url.username,
                      url.password
                    )
                  } else {
                    return nodegit.Cred.sshKeyFromAgent(username)
                  }
                },
              },
            },
          }

          const newDirectory = directory + "/" + themeName
          let authAttempted = false
          nodegit
            .Clone(url, newDirectory, cloneOpts)
            .then(function (repo) {
              // change folder name to variable
              console.log(
                "Cloned " + path.basename(url) + " to " + repo.workdir()
              )
            })
            .catch(function (err) {
              console.log(err)
            })
        } catch (err) {
          // Printing error if occurs
          console.error("Error while changing directory:" + err)
        }

        // go to webpack.config.js ammend proxy to variable

        // npm install

        // spawn new shell in new directory
        // https://syntaxfix.com/question/12443/change-working-directory-in-my-current-shell-context-when-running-node-script
      } else {
        return readyDownload()
      }
    })
}

async function completedItMate() {
  // Successfully downloaded
  // Run ‘code .’
  // ‘npm run build’ to start watch files
}

console.clear()
await welcome()
await disclaimer()
await StoreVariables()
await readyDownload()
await completedItMate()
