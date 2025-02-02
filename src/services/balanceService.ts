import {ethers} from "ethers";
import erc20_abi from './ABI/ERC_20.json'


const RpcUrls ={
  ETH: process.env.REACT_APP_RPC_URL_MAINNET,
  BNB: process.env.REACT_APP_RPC_URL_BSC,
  POLYGON: process.env.REACT_APP_RPC_URL_POLYGON_MAINNET,
  XDAI: process.env.REACT_APP_RPC_URL_XDAI,
}

const provider =  {
  ETH : new ethers.providers.JsonRpcProvider(RpcUrls.ETH),
  BNB: new ethers.providers.JsonRpcProvider(RpcUrls.BNB),
  POL : new ethers.providers.JsonRpcProvider(RpcUrls.POLYGON),
  DAI: new ethers.providers.JsonRpcProvider(RpcUrls.XDAI),
}
 
//logic: token -> provider for each chain
const availableTokens = {
  ETH:{
    BNB: new ethers.Contract('0x2170ed0880ac9a755fd29b2688956bd959f933f8', erc20_abi, provider.BNB),
    POL: new ethers.Contract('0xfD8ee443ab7BE5b1522a1C020C097CFF1ddC1209', erc20_abi, provider.POL),
    DAI: new ethers.Contract('0xa5c7cb68cd81640D40c85b2e5Ec9E4Bb55Be0214', erc20_abi, provider.DAI) 
  }, // check
  BNB:{
    ETH: new ethers.Contract('0xB8c77482e45F1F44dE1745F52C74426C631bDD52', erc20_abi, provider.ETH),
    POL: new ethers.Contract('0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F', erc20_abi, provider.POL),
    DAI: new ethers.Contract('0xCa8d20f3e0144a72C6B5d576e9Bd3Fd8557E2B04', erc20_abi, provider.DAI) // xdai explorer says wbnb 0xCa8d20f3e0144a72C6B5d576e9Bd3Fd8557E2B04
  }, // check
  POL:{
    ETH: new ethers.Contract('0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', erc20_abi, provider.ETH),
    BNB: new ethers.Contract('0xa90cb47c72f2c7e4411e781772735d9317d08dd4', erc20_abi, provider.BNB),
    DAI: new ethers.Contract('0x7122d7661c4564b7C6Cd4878B06766489a6028A2', erc20_abi, provider.DAI) 
  }, //check
  DAI:{
    ETH: new ethers.Contract('0x6b175474e89094c44da98b954eedeac495271d0f', erc20_abi, provider.ETH),
    BNB: new ethers.Contract('0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3', erc20_abi, provider.BNB),
    POL: new ethers.Contract('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', erc20_abi, provider.POL),
    
    
  },
}


function getListOfSupportedTokens() {
  return Object.keys(availableTokens)
};

async function getTokenBalanceFor(tokenList:Array<string>, walletAdress: string) {
  
  //TODO:check if unsupported token in given List.
  if (!tokenList.every(r=> getListOfSupportedTokens().includes(r))){
    console.log("Some of the provided tokens are not supported");
    return null;
  }


  var balances: {[k: string]: object} = {}
  for(const t in tokenList){
    var balanceAcrossChains: {[k: string]: number} = {}
    // get native/base chain token balance
    // TODO: What if token is not a chain/base native token?
    const providerIndex: keyof typeof provider = tokenList[t] as keyof typeof provider;
  
    const nativeBalance = await provider[providerIndex].getBalance(walletAdress);
    balanceAcrossChains[tokenList[t]] = parseFloat(ethers.utils.formatEther(nativeBalance));
    
    // get token on other chains
    const tokenIndex: keyof typeof availableTokens = tokenList[t] as keyof typeof availableTokens;
    const chains = availableTokens[tokenIndex];
    for (const [chain, contract] of Object.entries(chains)) {
      const externalBalance = await contract.balanceOf(walletAdress);
      balanceAcrossChains[chain] = parseFloat(ethers.utils.formatEther(externalBalance))
    }
    balances[tokenList[t]] = balanceAcrossChains;
  }
  console.table(balances)
  return balances
 
};


 getTokenBalanceFor(getListOfSupportedTokens(), "0x520fF0fBAC3cd357F29030741Cf8b4acB1e01e0B");






async function getEthAcrossChains(wallet: string){
  return new Promise(async (resolve, reject) =>  {

    const onEth = await provider.ETH.getBalance(wallet);
    const onBsc = await availableTokens.ETH.BNB.balanceOf(wallet);
    const onPolygon = await availableTokens.ETH.POL.balanceOf(wallet);
    const onXdai = await availableTokens.ETH.DAI.balanceOf(wallet);

    const ethBalances = {
      onEth : parseFloat(ethers.utils.formatEther(onEth)),
      onBsc : parseFloat(ethers.utils.formatEther(onBsc)),
      onPolygon : parseFloat(ethers.utils.formatEther(onPolygon)),
      onXdai : parseFloat(ethers.utils.formatEther(onXdai)),
    }

    resolve (ethBalances)
  })
}

async function getDaiAcrossChains(wallet: string){
  return new Promise(async (resolve, reject) =>  {

    const onEth = await availableTokens.DAI.ETH.balanceOf(wallet);
    const onBsc = await availableTokens.DAI.BNB.balanceOf(wallet);
    const onPolygon = await availableTokens.DAI.POL.balanceOf(wallet);
    const onXdai = await provider.DAI.getBalance(wallet); // moved

    const daiBalances = {
      onEth : parseFloat(ethers.utils.formatEther(onEth)),
      onBsc : parseFloat(ethers.utils.formatEther(onBsc)),
      onPolygon : parseFloat(ethers.utils.formatEther(onPolygon)),
      onXdai : parseFloat(ethers.utils.formatEther(onXdai)),
    }

    resolve (daiBalances)
  })
}

async function getPolygonAcrossChains(wallet: string){
  return new Promise(async (resolve, reject) =>  {

    const onEth = await availableTokens.POL.ETH.balanceOf(wallet);
    const onBsc = await availableTokens.POL.BNB.balanceOf(wallet);
    const onPolygon =  await provider.POL.getBalance(wallet);
    const onXdai = await availableTokens.POL.DAI.balanceOf(wallet);

    const polygonBalances = {
      onEth : parseFloat(ethers.utils.formatEther(onEth)),
      onBsc : parseFloat(ethers.utils.formatEther(onBsc)),
      onPolygon : parseFloat(ethers.utils.formatEther(onPolygon)),
      onXdai : parseFloat(ethers.utils.formatEther(onXdai)),
    }

    resolve (polygonBalances)
  })
}

async function getBNBAcrossChains(wallet: string){
  return new Promise(async (resolve, reject) =>  {

    const onEth = await availableTokens.BNB.ETH.balanceOf(wallet);
    const onBsc = await provider.BNB.getBalance(wallet);
    const onPolygon = await availableTokens.BNB.POL.balanceOf(wallet);
    const onXdai = await availableTokens.BNB.DAI.balanceOf(wallet);

    const bnbBalances = {
      onEth : parseFloat(ethers.utils.formatEther(onEth)),
      onBsc : parseFloat(ethers.utils.formatEther(onBsc)),
      onPolygon : parseFloat(ethers.utils.formatEther(onPolygon)),
      onXdai : parseFloat(ethers.utils.formatEther(onXdai)),
    }

    resolve (bnbBalances)
  })
}


export {getEthAcrossChains, getBNBAcrossChains, getDaiAcrossChains, getPolygonAcrossChains, getTokenBalanceFor, getListOfSupportedTokens}


