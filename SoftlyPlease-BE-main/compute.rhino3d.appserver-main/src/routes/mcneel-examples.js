const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

router.get('/', function(req, res, next) {
    const examplesDir = path.join(__dirname, '../examples')
    const definitions = []

    try {
        // Read all directories in examples folder
        const items = fs.readdirSync(examplesDir, { withFileTypes: true })

        items.forEach(item => {
            if (item.isDirectory() && item.name !== '_common' && item.name !== 'favicon' && item.name !== 'wip') {
                const examplePath = path.join(examplesDir, item.name)
                const indexPath = path.join(examplePath, 'index.html')

                // Check if index.html exists
                if (fs.existsSync(indexPath)) {
                    // Create a readable name from directory name
                    let displayName = item.name
                        .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
                        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                        .trim()

                    definitions.push({
                        name: displayName,
                        url: `/examples/${item.name}/index.html`
                    })
                }
            }
        })

        // Sort alphabetically
        definitions.sort((a, b) => a.name.localeCompare(b.name))

    } catch (error) {
        console.error('Error reading examples directory:', error)
        // Return empty array if there's an error
    }

    res.render('mcneel-examples', {
        title: 'McNeel Examples',
        definitions: definitions
    });
});

module.exports = router;
