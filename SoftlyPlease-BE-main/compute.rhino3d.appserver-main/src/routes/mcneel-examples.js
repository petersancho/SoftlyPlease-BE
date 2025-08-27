const express = require('express')
const router = express.Router()

router.get('/', function(req, res, next) {
    let definitions = []
    // Assuming definitions are available through req.app.get('definitions')
    req.app.get('definitions').forEach(def => {
        let url;
        if (def.name === 'BranchNodeRnd.gh') {
            url = '/examples/spikyThing/index.html';
        } else {
            url = `/examples/${def.name.replace('.gh', '').replace('.ghx', '')}/index.html`;
        }
        definitions.push({ name: def.name, url: url });
    });
    res.render('mcneel-examples', { title: 'McNeel Examples', definitions: definitions });
});

module.exports = router;
