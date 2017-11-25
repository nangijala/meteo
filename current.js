
const fs = require('fs')
var colData = []
const fileName = '/mnt/RAMDisk/data.json'
if( fs.existsSync(fileName)){
	colData = require(fileName)
	console.log( colData.length )
	colData.forEach( (d) => {
		console.log(`${d.created} ${d.innen} ${d.ldr} ${d.air} ${d.ldr > 95000 ? 'N' : 'T'}`)	
	})
}
