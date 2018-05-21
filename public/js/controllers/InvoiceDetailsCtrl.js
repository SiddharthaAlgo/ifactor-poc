	angular.module('InvoiceDetailsCtrl', []).controller('InvoiceDetailsController',['$scope', '$rootScope', '$http', 
			'$location', 'GetPost', 'Helper', '$routeParams', 'ngToast', 'Upload',
			function($scope, $rootScope, $http, $location, GetPost,Helper, $routeParams, ngToast, Upload) {

		$scope.priceSlider = 100;
       $scope.factorSliderOptions = {
            floor: 0,
            ceil: 100
        };

       $scope.chargesSliderOptions = {
            floor: 0,
            ceil: 10
        };

	//PNotify.alert('Notice me, senpai!');

	$rootScope.invoiceId = $rootScope.invoiceId || $routeParams.invoiceId;
	$scope.urlMap = function(type) {
		if (type == 'createInvoice') {
			$location.path('/create-invoice');
		}
		$scope.dashboardUrl = {
			Buyer : '/views/buyer/invoiceDetails.html',
			Financer : '/views/financier/invoiceDetails.html',
			Supplier : '/views/supplier/invoiceDetails.html'
		}

		$scope.templateUrlInvoice = $scope.dashboardUrl[type];
	};

	$scope.getDashboardDetails = function () {
		$location.path('./dashboard');
	};

	GetPost.get({ url : '/startApp' }, function(err, resp) {
		if (!resp.status) {
			$location.path('/login');
		} else {
			console.log('userType', $rootScope.userType, 'invoiceId', $rootScope.invoiceId);
			$scope.urlMap(resp.data.userType);
			$rootScope.userType = resp.data.userType;
			console.log('invoiceId', $rootScope.invoiceId)
			$scope.getInvoiceDetails();
		}
    });

	$scope.gotoDashboard = function() {
		console.log('gotoDashboard')
		$location.path('/dashboard');
	}

	/*var showAlert = function(msg, className='success') {
		ngToast.create({
			className: className, // "success", "info", "warning" or "danger"
			horizontalPosition : 'center',
			content: msg
		});
	};*/

	$scope.toastReqPayment = function() {
		console.log('payment request')
		Helper.showAlert('request_payment');
	}

	var invoiceStatusMap = Helper.invoiceStatusMap;

	$scope.date = new Date();
	$scope.eventSources = [];

	$scope.setStatusClasses = function (data) {
		var userType = $rootScope.userType;
		for (var i = 0; i < data.length; i++) {
			if (data[i].state) {
				data[i].status = invoiceStatusMap[userType][data[i].state];
				data[i].stateClass = Helper.statusClassMap[data[i].state];
			}
		}

		return data;
	};

	$scope.getInvoiceStatus = function(state) {
		console.log('this.state.', state);
		var status = invoiceStatusMap[$rootScope.userType][state];
		return status;
	}

	$scope.getStatusClass = function(state) {
		return Helper.statusClassMap[state];
	}


	if (!$rootScope.mainInvoiceIndex) {
		$rootScope.mainInvoiceIndex = 0;
	}
	
	$scope.dashboardData = [];
	$scope.invoiceData = [];
	$scope.invoiceTxHistory = [];
    $scope.getInvoiceDetails = function() {
		var data = {
			url : '/getInvoiceDetails',
			invoiceId : $rootScope.invoiceId || $routeParams.invoiceId
		};
		GetPost.post(data, function(err, resp) {
			console.log('invoiceDetails response');
			$scope.invoiceData = resp.data.invoice;
			$rootScope.balance = resp.data.balance;
			$scope.invoiceTxHistory = resp.data.invoiceHistory;
			$scope.allEvents = resp.data.otherEvents;
			$scope.transferEvents = resp.data.tarnsferEvents;
			mapInvoiceHistory($scope.invoiceTxHistory);
			$scope.setCurrentStage();
		});
    }


    var mapInvoiceHistory = function(invoiceHistory) {
    	var tx;
		for (var i in invoiceHistory) {
			tx = invoiceHistory[i];
			switch(tx.event) {
				case 'invoiceHistory' :
					tx.eventDName = 'Invoice History',
					tx.status = invoiceStatusMap[$scope.userType][tx.args.state];
			}
		}
		//invoiceHistory.reverse();
    };


    $scope.getDatesDiff = function(date) {
    	var date1 = new Date(date);
    	var date2 = new Date();
	    var diff = (Math.ceil((date1.getTime() - date2.getTime()) /
	            (1000 * 3600 * 24))/365);
	    return (diff*360).toFixed(0);
	};


	$scope.filterTransactionHistory = function(state, txhash) {
		console.log('filterTransactionHistory');
		console.log($scope.invoiceTxHistory);
		var tx;
	    for (var i  in $scope.invoiceTxHistory) {
	        tx = $scope.invoiceTxHistory[i];
	        console.log(tx.args.state, state)
	        if (tx.args && tx.args.state == state) {
	            return !txhash ? tx : tx.transactionHash;
	        }
	    }
	    return {};
	};

	$scope.downloadDocs = function(docField) {
		console.log('downloadDocs : inside downloadDocs');
		console.log(docField, $scope.invoiceData[docField])
    	var data = {
			docUrl : $scope.invoiceData[docField],
			name : docField + '.pdf',
			url : '/downloadInvoiceDocs'
		}
		if (!data.docUrl) {
			console.log('no documents to download');
			return;
		}
		window.open('/downloadInvoiceDocs?docUrl='+
			$scope.invoiceData[docField] + '&name=' + data.name, '_blank');
	};

	// invoiceId
	// use $rootScope.invoiceId

	/***************************supplier api*************************/

	// used
	$scope.requestFactoring = function (input) {

		var data = {
			url : '/requestFactoring',
			invoiceId : $rootScope.invoiceId,
			invoiceAmount : $scope.invoiceData.invoiceAmount
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('ifactor_request');
    		console.log(resp);
    		// 'ifactor_request'
			$scope.getInvoiceDetails();
	    });

	};
	

	// used
	$scope.rejectFactoringProposal = function (input) {
		console.log('rejectFactoringProposal');
		var data = {
			url : '/rejectFactoringProposal',
			invoiceId : $rootScope.invoiceId,
			remark : $scope.proposalActionForm.remark
		}
		
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('ifactor_proposal_rejected');
			$scope.getInvoiceDetails();
	    });

	};
	

	/***************************buyer api*************************/
	$scope.invoiceActionForm = {};
	// used
	$scope.approveInvoice = function (input) {

		var data = {
			url : '/approveInvoice',
			invoiceId : $rootScope.invoiceId,
			buyerInvoiceRemark : $scope.invoiceActionForm.remark
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : 
				Helper.createToast('You approved Invoice for ' + $rootScope.invoiceId, 'success');
			$scope.invoiceActionForm = {};
			$scope.getInvoiceDetails();
	    });

	};

	// used
	$scope.rejectInvoice = function (input) {
		var data = {
			url : '/rejectInvoice',
			invoiceId : $rootScope.invoiceId
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : 
				Helper.createToast('You rejected Invoice for ' + $rootScope.invoiceId, 'danger');
    		// invoice_rejected
			$scope.getInvoiceDetails();
	    });

	};

	$scope.isTransferEvents = function() {
		var events = $scope.transferEvents;
		if (!events || events.length < 1) {
			return false;
		}
		return true;
	};

	$scope.payInvoice = function () {
			console.log('supplierAddress : ', $scope.invoiceData.supplierAddress);
			console.log('financerAddress : ', $scope.invoiceData.financerAddress);
			console.log('buyerAddress : ', $scope.invoiceData.buyerAddress)
		var data = {
			url : '/payInvoice',
			invoiceId : $rootScope.invoiceId,
			supplierAddress : $scope.invoiceData.supplierAddress,
			financerAddress : $scope.invoiceData.financerAddress,
			buyerAddress : $scope.invoiceData.buyerAddress,
			invoiceAmount : $scope.invoiceData.invoiceAmount
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('payment_success');
			$scope.getInvoiceDetails();
	    });

	};


	/***************************financier api*************************/
	

	// used
	$scope.acceptFactoringForm = {
		platformCharges : 0,
		saftyPercentage : 0,
		acceptFactoringRemark : '',
		payableDate : $scope.invoiceData.payableDate
	};

    $scope.ifactorProposalDocs = null;
    $scope.ifDocs = null;
    $scope.factoringProposal = function (ifactorProposalDocs) {
		$scope.acceptFactoringForm.invoiceAmount = $scope.invoiceData.invoiceAmount;
	    Upload.upload({
	        url: '/factoringProposal',
            method : 'POST',
            headers: { 'Content-Type': 'multipart/form-data' },
            arrayKey : '',
	        data : {
				invoiceId : $rootScope.invoiceId,
				input :	$scope.acceptFactoringForm,
				ifactorProposalDocs : ifactorProposalDocs
	        }
	    }).then(function (resp) {
			console.log($scope.ifactorProposalDocs);
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('ifactor_proposed');
			$scope.factorFlags.proceedIfactorRequest = false;
			$scope.getInvoiceDetails();
	    }, function (resp) {
	        console.log('Error status: ' + resp.status);
	    }, function (evt) {
	        //console.log(evt);
	    });
	};


	$scope.proposalActionForm = {
		remark : ''
	};
	// used
	$scope.rejectFactoringRequest = function () {
		console.log('remark');
		console.log($scope.proposalActionForm);
		var data = {
			url : '/rejectFactoringRequest',
			invoiceId : $rootScope.invoiceId,
			remark : $scope.proposalActionForm.remark
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('ifactor_rejected');
			$scope.factorFlags.proceedIfactorRequest = false;
			$scope.factorFlags.rejectIfactorRequest = false;
    		// 'ifactor_rejected'
			$scope.getInvoiceDetails();
	    });
	};

	$scope.acceptFactoringProposal = function () {
		var data = {
				url : '/acceptFactoringProposal',
				invoiceId : $rootScope.invoiceId,
				remark : $scope.proposalActionForm.remark
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('ifactor_rejected');
			$scope.getInvoiceDetails();
	    });
	};

	// used
	$scope.prepaySupplier = function (input) {
		var data = {
			url : '/prepaySupplier',
			invoiceId : $rootScope.invoiceId,
			supplierAddress : $scope.invoiceData.supplierAddress,
			financerAddress : $scope.invoiceData.financerAddress,
			buyerAddress : $scope.invoiceData.buyerAddress
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('payment_success');
    		// 'ifactor_prepaid'
			$scope.getInvoiceDetails();
	    });
	};

	$scope.postpaySupplier = function (input) {
		var data = {
			url : '/postpaySupplier',
			invoiceId : $rootScope.invoiceId,
			supplierAddress : $scope.invoiceData.supplierAddress,
			financerAddress : $scope.invoiceData.financerAddress,
			buyerAddress : $scope.invoiceData.buyerAddress
		}
		GetPost.post(data, function(err, resp) {
    		console.log(resp);
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('payment_success');
    		// 'completed'
			$scope.getInvoiceDetails();
	    });
	};

	$scope.factorFlags = {
		proceedIfactorRequest : false,
		rejectIfactorRequest : false
	}

	$scope.isIfactorRequested = function() {
		return $scope.invoiceData.state == 'ifactor_request' &&
			!$scope.factorFlags.proceedIfactorRequest && !$scope.factorFlags.rejectIfactorRequest;
	}

	$scope.proceedRequest = function() {
		console.log('proceed Request');
		$scope.factorFlags.proceedIfactorRequest = true;
	}

	$scope.rejectRequest = function() {
		console.log('reject Request');
		$scope.factorFlags.rejectIfactorRequest = true;
	}

	$scope.isBuyerPayable = function() {
	    var list = ['ifactor_proposal_accepted', 'ifactor_prepaid', 'invoice_paid'];
	    var flag = list.indexOf($scope.invoiceData.state) >= 0 ? true : false;
	    return flag;
	};

	$scope.isBuyerApproved = function() {
		var list = ['invoice_accepted', 'ifactor_request', 'ifactor_rejected'];
	    return list.indexOf($scope.invoiceData.state) >= 0 ? true : false;		
	}

	$scope.stateOptions = [
            'draft',
            'invoice_created',
            'invoice_rejected',
            'invoice_accepted',
            'ifactor_request',
            'ifactor_rejected',
            'ifactor_proposed',
            'ifactor_proposal_accepted',
            'ifactor_proposal_rejected',
            'ifactor_prepaid',
            'invoice_paid',
            'completed'
	];

	$scope.stageOptions = [
		'goods_delivered',
		'buyer_confirmation',
		'factoring_request',
		'payment_disbursed',
		'contract_complete'
	];

	console.log($scope.stateOptions);

	var invoiceStages = {
		goods_delivered : 1,
		buyer_confirmation : 2,
		factoring_request : 3,
		payment_disbursed : 4,
		contract_complete : 5
	};

	var invoiceStates = {
	    draft : 1,
	    invoice_created : 2,
	    invoice_rejected : 3,
	    invoice_accepted : 4,
	    ifactor_request : 5,
	    ifactor_rejected : 6,
	    ifactor_proposed : 7,
	    ifactor_proposal_accpted : 9,
	    ifactor_proposal_rejected : 8,
	    ifactor_prepaid : 10,
	    invoice_paid : 11,
	    completed : 12
	};

	$scope.invoiceStageMap = {
		'Buyer' : {
			goods_delivered : [],
			buyer_confirmation : ['invoice_created', 'invoice_accepted', 'invoice_rejected'],
			factoring_request : ['ifactor_request', 'ifactor_rejected', 'ifactor_proposed',
				'ifactor_proposal_accepted', 'ifactor_proposal_rejected'
			],
			payment_disbursed : ['ifactor_prepaid'],
			contract_complete : ['invoice_paid', 'completed']
		},
		'Supplier' : {
			goods_delivered : [],
			buyer_confirmation : ['invoice_created', 'invoice_rejected'],
			factoring_request : ['invoice_accepted', 'ifactor_request', 'ifactor_rejected', 'ifactor_proposed',
				'ifactor_proposal_rejected'
			],
			payment_disbursed : ['ifactor_proposal_accepted', 'ifactor_prepaid', 'invoice_paid'],
			contract_complete : ['completed']
		},
		'Financer' : {
			goods_delivered : [],
			buyer_confirmation : ['invoice_created', 'invoice_rejected', 'invoice_accepted'],
			factoring_request : ['ifactor_request', 'ifactor_rejected', 'ifactor_proposed',
				'ifactor_proposal_rejected'
			],
			payment_disbursed : ['ifactor_proposal_accepted', 'ifactor_prepaid', 'invoice_paid'],
			contract_complete : ['completed']
		}
	};

	$scope.setCurrentStage = function() {
		//var userType = $scope.userType;
		var userType = $scope.userType;
		var currentState = $scope.invoiceData.state;
		var stageMap = $scope.invoiceStageMap[userType];
		for (var stageKey in stageMap) {
			if (stageMap[stageKey].indexOf(currentState) != -1) {
				$scope.currentStage = stageKey;
			}
		}
	};

	$scope.isStageEnabled = function(stage) {
		var currentStage = $scope.currentStage;
		var stageNo = invoiceStages[stage];
		var currentStageNo = invoiceStages[currentStage];
		//console.log('isStageEnabled', stage, stageNo, currentStageNo, (stageNo > (currentStageNo - 2)));
		return $scope.showHistoryFlag || (stageNo > (currentStageNo - 2));
	}

	$scope.isStageOpaque = function(stage) {
		var currentStage = $scope.currentStage;
		var stageNo = invoiceStages[stage];
		var currentStageNo = invoiceStages[currentStage];
		//console.log('isStageOpaque', stage, stageNo, currentStageNo, (stageNo > currentStageNo));
		return stageNo > currentStageNo;
	}

	$scope.isCurrentStage = function(stage) {
		//console.log('isCurrentStage', stage, $scope.currentStage, (stage == $scope.currentStage));
		return stage == $scope.currentStage;
	}

	$scope.isOldStage = function(stage) {
		var currentStage = $scope.currentStage;
		var stageNo = invoiceStages[stage];
		var currentStageNo = invoiceStages[currentStage];
		return (stageNo < currentStageNo);
	}

	$scope.isHistoryBarEnabled = function(stage) {
		if ($scope.showHistoryFlag) {
			return false;
		}
		var currentStage = $scope.currentStage;
		var stageNo = invoiceStages[stage];
		var currentStageNo = invoiceStages[currentStage];
		//console.log('isHistoryBarEnabled', stage, stageNo, currentStageNo, (stageNo == (currentStageNo-1)));
		return (stageNo == (currentStageNo-2));
	};

	$scope.showHistoryFlag = false;
	$scope.showHistory = function() {
		$scope.showHistoryFlag = true;
	}

   $scope.onRating = function(rating) {
   		console.log('inside onrating')
		if ($rootScope.userType == 'Supplier') {
			$scope.financerRatings = rating;
		} else {
			console.log('ratings', rating)
			$scope.supplierRatings = rating;
		}
    };

    $scope.rateSupplier = function() {
		/*hasFinancerRated : true
		hasSupplierRated : true*/
		console.log('$scope.supplierRatings', $scope.supplierRatings)
    	if (!$scope.supplierRatings) {
			Helper.showAlert('rate_supplier_mandatory');
			return;
    	}
		var data = {
			url : '/rateSupplier',
			invoiceId : $rootScope.invoiceId,
			supplierRatings : $scope.supplierRatings,
			supplierRatingRemark : $scope.supplierRatingRemark
		}
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('ratings_f2s');
			$scope.getInvoiceDetails();
	    });
    };

    $scope.rateFinancer = function() {
    	if (!$scope.financerRatings) {
			Helper.showAlert('rate_financer_mandatory');
			return;
    	}
		var data = {
			url : '/rateFinancer',
			invoiceId : $rootScope.invoiceId,
			financerRatings : $scope.financerRatings,
			financerRatingRemark : $scope.financerRatingRemark
		};
		GetPost.post(data, function(err, resp) {
			!resp.status ? Helper.showAlert('error500') : Helper.showAlert('ratings_s2f');
			$scope.getInvoiceDetails();
	    });
    };

}]);