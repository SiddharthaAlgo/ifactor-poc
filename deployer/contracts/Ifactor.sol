pragma solidity ^0.4.4;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract Ifactor is StandardToken {
    struct Invoice {
        string invoiceId;
        uint invoiceNo;
        uint amount;
        address supplier;
        address buyer;
        address financer;
    	string state;
        address[] owners;
    	uint factorCharges;
    	uint factorInterest;
    	uint factorSaftyPercentage;        
    }
    
    address owner;

    mapping (string => Invoice) Invoices;
    
    modifier mustBeOwner() {
        require(msg.sender == owner);
        _;
    }

	function Ifactor() public {
	    owner = msg.sender;
	    totalSupply_ = 100000;
	    balances[msg.sender] = 100000;
	}

	function setTotalSupply(uint _amt) {
		totalSupply_ = _amt;
	}

	function buyTokens(address _address) {
	    balances[_address] = 10000;
	    balances[owner] = balances[owner] - 10000;
	}

    function getBalance(address _address) public view returns(uint) {
        return balances[_address];
    }

	function addInvoice(string _invoice_id, uint _invoice_no, string _state, uint _amount,
						address _supplier, address _buyer) public {
		Invoice inv;
		inv.invoiceId = _invoice_id ;
		inv.invoiceNo = _invoice_no ;
		inv.state = _state ;
		inv.amount = _amount ;
		inv.supplier = _supplier ;
		inv.buyer = _buyer;
		Invoices[_invoice_id] = inv;
		createInvoice(_invoice_id, _invoice_no, _state, _amount, _supplier, _buyer);
	}

	function getState(string _invoice_id) public view returns(string) {
		Invoice inv = Invoices[_invoice_id];
		return inv.state;
	}

	function setState(string _invoice_id, string _invoice_state, uint _created) public {
		Invoice inv = Invoices[_invoice_id];
		inv.state = _invoice_state;
		invoiceHistory(_invoice_id, _invoice_state, _created);
	}
	
	function getAmount(string _invoice_id) public constant returns(uint) {
		Invoice inv = Invoices[_invoice_id];
        return inv.amount;
	}

	function addFactoring(string _invoice_id, address _financer, uint _factor_charges, uint _factor_safty_percentage, uint _created) public {
		Invoice inv = Invoices[_invoice_id];
		inv.financer = _financer;
		inv.factorCharges = _factor_charges;
		inv.factorSaftyPercentage = _factor_safty_percentage;
        setState(_invoice_id, 'ifactor_proposed', _created);
	    factoringProposal(_invoice_id, _financer, _factor_charges, _factor_safty_percentage, _created);
	}

	function prepayFactoring(string _invoice_id, uint _created) public {
		Invoice inv = Invoices[_invoice_id];
		//uint _value =  inv.amount * inv.factorSaftyPercentage;
		uint _value =  100;
		address _from = inv.financer;
		address _to = inv.supplier;
        transferFrom(_from, _to, _value);
        setState(_invoice_id, 'ifactor_prepaid', _created);
	}

    function payInvoice(string _invoice_id, uint _created) public {
		Invoice inv = Invoices[_invoice_id];
        address _from = inv.supplier;
        address _to = inv.financer;
        //uint _value = inv.amount;
        uint _value = 100;
        transferFrom(_from, _to, _value);
        setState(_invoice_id, 'invoice_paid', _created);
    }

	function postpayFactoring(string _invoice_id, uint _created) public {
		Invoice inv = Invoices[_invoice_id];
		/*uint _value = (inv.amount * 100) -
						(
							(inv.amount * inv.factorSaftyPercentage) +
							(inv.amount * inv.factorCharges)
						);*/
		uint _value = 100;
		address _from = inv.financer;
		address _to = inv.supplier;
        transferFrom(_from, _to, _value);
        setState(_invoice_id, 'invoice_paid', _created);
	}


	event createInvoice(string _invoice_id, uint _invoice_no, string _state, uint _amount,
						address _supplier, address _buyer);
	event invoiceHistory(string invoiceId, string state, uint created);
    event acceptInvoice(string invoiceId, uint created);
    event rejectInvoice(string invoiceId, uint created);
    event factoringProposal(string invoiceId, address financer, uint factorCharges, uint factorSaftyPercentage, uint created);
    event factoringAccepted(uint invoiceNo, string invoiceId, string state);
}