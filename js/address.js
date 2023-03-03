$(document).ready(function () {
    var param = getParam('a');

    checkNetwork();

    if (!$.isEmptyObject(param)) {
        $('#searchAddr').val(param);
        getAddress();
    }

});

$(document).on('click','.btn-go',function(){
    getAddress();
  });



function getAddress() {
    $('.data-info').empty();
    positionFooter();

    var addr = $('#searchAddr').val();
    var selectedNetwork = getSelectedMainnet();
    var selectedTestNetwork = getSelectedTestnet();

    if (selectedNetwork.length === 0 && selectedTestNetwork === 0){
        alert('Please select network');
        return;
    } else if (addr.length === 0){
        return;
    } else if (validateHash(40, addr) === false){

        if (addr.length === 40 ){
            addr = '0x' + addr;
            if (validateHash(40, '0x' + addr) == false) {
                alert('Invalid Address');
                return;
            }
        } else {
            alert('Invalid Address');
            return;
        }
    }


    $('.loader').show();
    var count = 0;
    var totalSelectedNetwork = selectedNetwork.length + selectedTestNetwork.length;

    $.each(selectedNetwork, function (key, value) {
        callMainnetNetwork('', addr,'',value, 2)
            .then(function (data) {
                if (data.error) {
                    generateTxErr(data.error, value);
                } else {
                    getEtherPrice('ETH', 'BTC,USD,EUR')
                        .then(function (ethPrice) {
                            generateAddrInfo(data.result, value, ethPrice, addr, true);
                        });
                }

                count++;

                if (count == totalSelectedNetwork) {
                    $('.loader').hide();
                    $('.datasource').show();
                    positionFooter();
                }

            }, function(err){
                generateTxErr(err.statusText, value);

                count++;

                if (count == totalSelectedNetwork) {
                    $('.loader').hide();
                    $('.datasource').show();
                    positionFooter();
                }
            });
    });

    $('.loader').show();

    $.each(selectedTestNetwork, function (key, value) {
        callTestnetNetwork('', addr,'',value, 2)
            .then(function (data) {
                if (data.error) {
                    generateTxErr(data.error, value);
                } else {
                    getEtherPrice('ETH', 'BTC,USD,EUR')
                        .then(function (ethPrice) {
                            generateAddrInfo(data.result, value, ethPrice, addr, false);
                        });
                }

                count++;

                if (count == totalSelectedNetwork) {
                    $('.loader').hide();
                    $('.datasource').show();
                    positionFooter();
                }

            }, function(err){
                generateTxErr(err.statusText, value);

                count++;

                if (count == totalSelectedNetwork) {
                    $('.loader').hide();
                    $('.datasource').show();
                    positionFooter();
                }
            });

    });


}

async function generateAddrInfo(result, network, ethPrice, addr, isMainnet) {

    try {
        var header = '<div class="card mt-3"> <div class="card-body"> <h5 class="card-title">{{network}}</h5>';
        var output = '';

        if (result == null) {
            header += '<div class="row"><div class="col-sm-12">Address not found</div></div>';
            output = header.replace('{{network}}', network);
        } else {

            var lbl = '<div class="row mb-1"><div class="col-sm-2 text-nowrap">{{label}}:</div><div class="col-sm-9">{{value}}</div></div>';

            output = header.replace('{{network}}', network);

            var _result = new BigNumber(result);
            var addrNonce = await getAddrNonce(addr, network, isMainnet)
            var etherValue = getEtherValue(_result);
            var usdPrice = ethPrice.USD * etherValue;
            var eurPrice = ethPrice.EUR * etherValue;
            var btcPrice = ethPrice.BTC * etherValue;
            var url = 'etherscan.io';

            if (network.indexOf('sepolia') > -1)
                url = 'sepolia.' + url;
            else if (network.indexOf('goerli') > -1)
                url = 'goerli.' + url;

            var addrUrl = '<a href="https://' + url + '/address/' + addr + '">' + addr + '</a>';

            output += lbl.replace('{{label}}', 'Address').replace('{{value}}', addrUrl);
            output += lbl.replace('{{label}}', 'Balance').replace('{{value}}', etherValue + ' Ether');
            output += lbl.replace('{{label}}', 'Current Nonce').replace('{{value}}', addrNonce);
            output += lbl.replace('{{label}}', 'USD Value').replace('{{value}}', '$ ' + usdPrice.toFixed(2) + ' <font size="1">(@' + ethPrice.USD + '/Eth)</font>');
            output += lbl.replace('{{label}}', 'EUR Value').replace('{{value}}', '€ ' + eurPrice.toFixed(2) + ' <font size="1">(@' + ethPrice.EUR + '/Eth)</font>');
            output += lbl.replace('{{label}}', 'BTC Value').replace('{{value}}', btcPrice.toFixed(2) + ' Btc' + ' <font size="1">(@' + ethPrice.BTC + '/Eth)</font>');

        }

        $('.data-info').append(output);
    } catch (err) {
        generateTxErr(err, network);
    }
}

async function getAddrNonce(addr, value, isMainnet) {

    if(isMainnet) {
        const nonce = await callMainnetNetwork('', addr,'',value, 4).then(function (data) {
            if (data.error) {
                return -1;
            } else {
                return parseInt(data.result)
            }
        })
        return nonce;
    } else {
        const nonce = await callTestnetNetwork('', addr,'',value, 4).then(function (data) {
            if (data.error) {
                return -1;
            } else {
                return parseInt(data.result)
            }
        })
        return nonce;
    }

    return -1;
}
