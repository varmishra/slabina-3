"use strict";

const Path = require("path");
const Pkg = require(Path.join(__dirname, "..", "package.json"));
const express = require("express");

// Helper utility for verifying and decoding the jwt sent from Salesforce Marketing Cloud.
const verifyJwt = require(Path.join(__dirname, "lib", "jwt.js"));
// Helper class that handles all the interactions with Salesforce Service Cloud
// and makes sure open connections are reused for subsequent requests.
const ServiceCloud = require(Path.join(__dirname, "lib", "sfdc.js"));
const sfdc = new ServiceCloud(Pkg.options.salesforce.serviceCloud);
const MarketingCloud = require(Path.join(__dirname, "lib", "extractScript.js"));
const sfmc = new MarketingCloud();


const app = express();

// Register middleware that parses the request payload.
app.use(
	require("body-parser").raw({
		type: "application/jwt"
	})
);

// Route that is called for every contact who reaches the custom split activity
app.post("/activity/execute", (req, res) => {
	verifyJwt(
		req.body,
		Pkg.options.salesforce.marketingCloud.jwtSecret,
		(err, decoded) => {
			// verification error -> unauthorized request
			if (err) {
				console.error(err);
				return res.status(401).end();
			}

			if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
				console.log(JSON.stringify(decoded.inArguments));
				//let marketingCloudId;
				//var decodedArgs = decoded.inArguments[0];
				//marketingCloudId = decodedArgs.customerKey;
				var marketingCloudId = "12345";
				// var url = "https://cors-anywhere.herokuapp.com/https://amc-creative-content.mgnt-xspdev.in/intelligent-segments/click_conversion/hux_intelligent_segment-2_6_2020.json";
				// fetch(url)
				// 	.then(function (response) {
				// 		console.log(response);
				// 		return response.json();
				// 	})
				// 	.then(function (obj) {
				// 		console.log(obj);
				// 		var i;
				// 		for (i = 0; i < Object.keys(obj.content).length; i++) {
				// 			if (obj.content[i].CUSTOMER_INDID == 12345) {
				// 				if (obj.content[i].segmentValue == "likely") {
				// 					return res.status(200).json({
				// 						branchResult: "likely"
				// 					});
				// 				}
				// 			}
				// 		}
				// 	})
				// 	.catch(function (error) {
				// 		console.error(error);
				// 		return res.status(400).end();
				// 	});
				// TODO: Read the Service Cloud object's Id from inArguments here and
				// write it to the serviceCloudId variable

				// Call the function that retrieves desired data from Service Cloud
				//sfmc.retrieveSegmentValue(marketingCloudId, (err, fieldValue) => {
				//	if (err) {
				//		console.error(err);
				//		return res.status(500).end();
				//	}

					// Check the returned value to make the decision which path should be
					// followed and return the branchResult accordingly.
					// if (fieldValue === "verylikely") {
					// 	return res.status(200).json({
					// 		branchResult: "verylikely"
					// 	});
					// } else if (fieldValue === "likely") {
					// 	return res.status(200).json({
					// 		branchResult: "likely"
					// 	});
					// } else if (fieldValue === "unlikely") {
					// 	return res.status(200).json({
					// 		branchResult: "unlikely"
					// 	});
					// } else {
						if(marketingCloudId === "12345"){
					 	return res.status(200).json({
							branchResult: "neutral"
						});
					}else{
							return res.status(200).json({
								branchResult: "likely"
							});
					}
					//}
				//});
				// return res.status(200).json({
				// 	branchResult: "verylikely"
				// })
			} else {
				console.error("inArguments invalid.");
				return res.status(400).end();
			}
		}
	);
});

// Routes for saving, publishing and validating the custom activity. In this case
// nothing is done except decoding the jwt and replying with a success message.
app.post(/\/activity\/(save|publish|validate)/, (req, res) => {
	verifyJwt(
		req.body,
		Pkg.options.salesforce.marketingCloud.jwtSecret,
		(err, decoded) => {
			// verification error -> unauthorized request
			if (err) return res.status(401).end();

			return res.status(200).json({
				success: true
			});
		}
	);
});

// Serve the custom activity's interface, config, etc.
app.use(express.static(Path.join(__dirname, "..", "public")));

// Start the server and listen on the port specified by heroku or defaulting to 12345
app.listen(process.env.PORT || 12345, () => {
	console.log("Service Cloud customsplit backend is now running!");
});