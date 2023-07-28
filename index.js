// Modulos externos 
const chalk = require("chalk");
const inquirer = require("inquirer");

// Modulos internos
const fs = require("fs");

operation();

function operation(params) {

    inquirer
    .prompt([
        {
        type:'list',
        name:'action',
        message:'O que você deseja fazer?',
        choices: [
            'Criar Conta',
            'Consultar Saldo',
            'Depositar',
            'Transferir',
            'Sacar',
            'Sair',
        ],
    },
])
.then((answer) => {
    const action = answer['action'];

    if(action === 'Criar Conta'){
        createAccount();
    } else if(action === 'Consultar Saldo'){
        checkBalance();
    } else if(action === 'Depositar'){
        deposit();
    } else if(action === 'Sacar'){
        withdrawFunds();
    } else if(action === 'Transferir'){
        transferFunds();
    } else if(action === 'Sair'){
        console.log(chalk.bgBlue.black('Obrigado por usar o Account'));
        process.exit();
    }

})
.catch(err => console.log(err))
};

//Create an Account

function createAccount() {
    console.log(chalk.bgGreen.black('Parabéns por escolher o nosso banco!'));
    console.log(chalk.green('Defina as opções da sua conta a seguir'));

    buildAccount();
};

function buildAccount() {
    inquirer.prompt([
        {
            name:'accountName',
            message:'Digite um nome para a sua conta:',
        },
    ])
    .then((answer) => {
        const accountName = answer['accountName'];

        console.info(accountName);

        if(!fs.existsSync('accounts')) {
            fs.mkdirSync('accounts');
        };

        if(fs.existsSync(`accounts/${accountName}.json`)) {
            console.log(
              chalk.bgRed.black('Essa conta já existe, por favor escolha outro nome')
            );
            buildAccount();
            return;
        };

        fs.writeFileSync(`accounts/${accountName}.json`, '{"balance": 0}', 
        function(err) {
            console.log(err);
        });

      console.log(chalk.green('Parabéns, a sua conta foi criada!'));
      operation();
    })
    .catch(err => console.log(err));
};

// Add an amount to the user account

function deposit() {
    
    inquirer.prompt([
        {
          name: 'accountName',
          message: 'Qual o nome da sua conta?'
        }
  ])
  .then((answer) => {
    const accountName = answer['accountName'];

    // verify that the account exists
    if(!checkAccount(accountName)) {
        return deposit();
    }

    inquirer.prompt([
        {
            name: 'amount',
            message:'Quanto você deseja despositar?'
        },
    ])
    .then((answer) => {

     const amount = answer['amount'];

     // add and amount
    addAmount(accountName, amount);

    operation();

    })
    .catch(err => console.log(err));

  })
  .catch(err => console.log(err));
};

//! Função própria!

// Check the amount of the account

function checkBalance() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Digite a conta para qual gostaria de verificar o saldo:'
        }
    ])
    .then((answer) => {
      const accountName = answer['accountName'];

      if(!checkAccount(accountName)){
        return checkBalance();
      }
        const accountData = getAccount(accountName); // Precisa ficar após o IF caso contrario em caso de erro o sistema não entra no checkAccount

        console.log(chalk.bgGreen.black(`O saldo em sua conta é de (R$:${accountData.balance})`));

        operation();
    })
    .catch((err) => console.log(err));
};

//! Função própria!

// Transfer an amount to the account selected

function transferFunds() {
    inquirer
    .prompt([
        {
            name: 'fromAccount',
            message: 'Insira o nome da sua conta:'
        }
    ])
    .then((answer) => {
      const fromAccount = answer['fromAccount'];

      if(!checkAccount(fromAccount)){
        return transferFunds();
      }

      const fromAccountData = getAccount(fromAccount); 

      console.log(chalk.bgGreen.black(`O saldo em sua conta é de (R$:${fromAccountData.balance})`));

      inquirer.prompt([
        {
            name: 'amount',
            message: 'Quanto gostaria de transferir:'
        }
    ])
    .then((answer) => {
        const amount = parseFloat(answer['amount']);

        if(isNaN(amount) || amount <= 0){
            console.log(chalk.bgRed.black('Por favor, insira um valor válido para a transferência.'));
            return transferFunds();
        }

        if(amount > fromAccountData.balance) {
            console.log(chalk.bgRed.black('Saldo insuficiente, insira um valor válido'));
            return transferFunds();
        }
    
        inquirer
        .prompt([
            {
                name: 'toAccount',
                message: 'Digite o nome da conta para qual deseja realizar a transferencia:'
            }
        ])
        .then((answer) => {
            const toAccount = answer['toAccount'];

            if(!checkAccount(toAccount)){
                console.log(chalk.bgRed.black('Conta não encontrada, tente novamente!'));
                return transferFunds();
            }

            const toAccountData = getAccount(toAccount);

            fromAccountData.balance -= amount;
            toAccountData.balance += amount;

            fs.writeFileSync(
                `accounts/${fromAccount}.json`,
                JSON.stringify(fromAccountData),
                function(err) {
                   if(err) {
                        console.log(err);
                   }
                }
            );

            fs.writeFileSync(
                `accounts/${toAccount}.json`,
                JSON.stringify(toAccountData),
                function(err) {
                    if(err) {
                        console.log(err);
                    }
                }
            );
            console.log(chalk.green(`Foi transferido R$${amount} da conta ${fromAccount} para a conta ${toAccount}.`));
            operation();  
        })
        .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))
  })
  .catch((err) => console.log(err));
};

// withdraw and amount from a account

function withdrawFunds() {
    inquirer.prompt([
        {
          name: 'accountName',
          message: 'Qual o nome da sua conta?'
        }
    ])
    .then((answer) => {
        const accountName = answer['accountName'];

        // verify that the account exists
        if(!checkAccount(accountName)) {
            return withdrawFunds();
        }

        inquirer.prompt([
            {
                name: 'amount',
                message: 'Digite o valor que gostaria de sacar:'
            }
        ])
        .then((answer) => {
            const amount = parseFloat(answer['amount']);

            if(isNaN(amount) || amount <= 0){
                console.log(chalk.bgRed.black('Por favor, insira um valor válido para a transferência.'));
                return transferFunds();
            }
            
            removeAmount(accountName, amount);
        })
        .catch((err) => console.log(err))

    })
    .catch((err) => console.log(err));
};

// Helper check account

function checkAccount(accountName) {
    if(!fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(chalk.bgRed.black('Essa conta não existe, tente novamente!'));
        return false;
    }

    return true;
};

// Helper add amount 

function addAmount(accountName, amount) {
    const accountData = getAccount(accountName);

    if(!amount){
        console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente!'));
        return deposit();
    }

    accountData.balance = parseFloat(amount) + parseFloat(accountData.balance);

    fs.writeFileSync(
        `accounts/${accountName}.json`,
        JSON.stringify(accountData),
        function(err) {
            console.log(err);
        },
    )
    console.log(chalk.green(`Foi realizado o depósito de (R$:${amount}) para a conta (${accountName})`));
};

// Helper to remove amount 

function removeAmount(accountName, amount) {
    const accountData = getAccount(accountName);

    if(isNaN(amount) || amount <= 0){
        console.log(chalk.bgRed.black('Por favor, insira um valor válido para a transferência.'));
        return withdrawFunds();
    }

    if(amount > accountData.balance) {
        console.log(chalk.bgRed.black('Saldo insuficiente, insira um valor válido'));
        return withdrawFunds();
    }

    accountData.balance = parseFloat(accountData.balance) - parseFloat(amount);

    fs.writeFileSync(
        `accounts/${accountName}.json`,
        JSON.stringify(accountData),
        function(err) {
            console.log(err);
        },
    )
    console.log(chalk.green(`Foi realizado o saque de (R$:${amount}) para a conta (${accountName})`));
    operation();
};

// Helper to get accounts

function getAccount(accountName) {
    const accountJSON = fs.readFileSync(`accounts/${accountName}.json`, {
        encoding: 'utf8',
        flag: 'r'
    });

    return JSON.parse(accountJSON);
};