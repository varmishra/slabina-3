class MarketingCloud {
    retrieveSegmentValue(id, cb) {
        var url = "https://cors-anywhere.herokuapp.com/https://amc-creative-content.mgnt-xspdev.in/intelligent-segments/click_conversion/hux_intelligent_segment-2_6_2020.json";
        fetch(url)
            .then(function (response) {
                console.log(response.body);
                return response.json();
            })
            .then(function (obj) {
                console.log(obj);
                var i;
                for (i = 0; i < Object.keys(obj.content).length; i++) {
                    if (obj.content[i].CUSTOMER_INDID == id) {
                        // return res.status(200).json({
                        //     branchResult: obj.content[i].segmentValue
                        // });
                        return cb(undefined, obj.content[i].segmentValue);
                    } else {
                        return cb(new Error('No unique result returned.'));
                    }
                }
            })
    }
}

module.exports = MarketingCloud