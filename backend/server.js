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
const fs = require("fs");
const jsonPath = Path.join(__dirname, "lib", "jsonObject.json");
var url = "https://amc-creative-content.mgnt-xspdev.in/intelligent-segments/click_conversion/hux_intelligent_segment-2_6_2020.json";
const fetch = require("node-fetch");
const fsx = require('fs-extra');


// Register middleware that parses the request payload.
app.use(
	require("body-parser").raw({
		type: "application/jwt"
	})
);

fsx.ensureFileSync(jsonPath)
fetch(url, {
		headers: {
			method: "GET",
			dataType: "jsonp",
			Accept: "jsonp",
			crossDomain: "true",
			jsonp: false
		}
	})
	.then(function (response) {
		//console.log(response);
		return response.json();
	})
	.then(function (objt) {
			console.log("storage start");

			let rawdata = JSON.stringify(objt);
			fs.writeFileSync(jsonPath, rawdata);
			//console.log(JSON.parse("jsonObject"));
			console.log("storage end");
	})

		let data = fs.readFileSync(jsonPath);
		let obj = JSON.parse(data);

function getSegment(marketingCloudId) {
	for (var i = 0; i < Object.keys(obj.content).length; i++) {
		if (obj.content[i].CUSTOMER_INDID === marketingCloudId) {
			return obj.content[i].segmentValue;
		}
	}
}

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
			
			try {
					if  (fs.existsSync(jsonPath)) {
              			  console.log("File exists");
						if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
						console.log(JSON.stringify(decoded.inArguments));
						let marketingCloudId;
						var decodedArgs = decoded.inArguments[0];
						marketingCloudId = decodedArgs.customerKey;
						var segValue = getSegment(marketingCloudId);

					// var i;
					// for (i = 0; i < (Object.keys(obj.content).length); i++) {
					// 	console.log(i);
					// if (obj.content[i].CUSTOMER_INDID == "12347") {
					// 	console.log(obj.content[i].CUSTOMER_INDID);
						switch (segValue) {
						case "verylikely":
							return res.status(200).json({
							branchResult: "verylikely"
							});
							break;
						case "likely":
							return res.status(200).json({
							branchResult: "likely"
							});
							break;
						case "neutral":
							return res.status(200).json({
							branchResult: "neutral"
							});
							break;
						default:
							return res.status(200).json({
							branchResult: "unlikely"
							});
						}
					} else {
						return res.status(200).json({
						branchResult: "unlikely"
						});
					}
					
		  
				} else {
					console.error("inArguments invalid.");
					return res.status(400).end();
				}	
			
		}
				catch (err) {
					console.log(err)
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