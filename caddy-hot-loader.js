import cloneDeep from 'lodash.clonedeep'

class JspmHotReloader {
  constructor (backendUrl) {
    this.socket = new window.WebSocket('ws://' + backendUrl)

    this.socket.onmessage = (e) => {
      console.log(e.data)
      if (e.data === 'caddy-hot-watcher connected') return

      let moduleName = e.data

      if (moduleName === 'index.html') {
        document.location.reload(true)
      } else {
        this.hotReload(moduleName)
      }
    }

    this.socket.onerror = (e) => {
      console.log(e)
    }

    this.socket.onopen = (e) => {
      console.log('hot reload connected to watcher on', backendUrl)
    }

    this.socket.onclose = () => {
      console.log('hot reload disconnected from', backendUrl)
    }

    console.log(System)
  }

  deleteModule (moduleToDelete) {
    let name = moduleToDelete.name
    if (!this.modulesJustDeleted[name]) {
      let exportedValue
      this.modulesJustDeleted[name] = moduleToDelete
      if (!moduleToDelete.exports) {
        exportedValue = System.get(name)
        if (!exportedValue) {
          throw new Error('Not yet solved usecase, please reload whole page')
        }
      } else {
        exportedValue = moduleToDelete.exports
      }
      if (typeof exportedValue.__unload === 'function') {
        exportedValue.__unload() // calling module unload hook
      }
      System.delete(name)
      console.log('deleted a module ', name)
    }
  }

  // what is a module record?
  getModuleRecord (moduleName) {
    return System.normalize(moduleName).then(normalizedName => {
      let aModule = System._loader.moduleRecords[normalizedName]
      if (!aModule) {
        aModule = System._loader.loads[normalizedName]
        if (aModule) {
          return aModule
        }
        return System.normalize(moduleName + '!').then(normalizedName => {  // .jsx! for example are stored like this
          let aModule = System._loader.moduleRecords[normalizedName]
          if (aModule) {
            return aModule
          }
          throw new Error('module was not found in Systemjs moduleRecords')
        })
      }
      return aModule
    })
  }

  // the magic hotness
  hotReload (moduleName) {
    const self = this
    const start = new Date().getTime()
    this.backup = { // in case some module fails to import
      moduleRecords: cloneDeep(System._loader.moduleRecords),
      loads: cloneDeep(System._loader.loads)
    }

    this.modulesJustDeleted = {}
    return this.getModuleRecord(moduleName).then(module => {
      this.deleteModule(module)
      const toReimport = []

      function deleteAllImporters (importersToBeDeleted) {
        importersToBeDeleted.forEach((importer) => {
          self.deleteModule(importer)
          if (importer.importers.length === 0 && toReimport.indexOf(importer.name) === -1) {
            toReimport.push(importer.name)
          } else {
            // recurse
            deleteAllImporters(importer.importers)
          }
        })
      }

      if (module.importers.length === 0) {
        toReimport.push(module.name)
      } else {
        deleteAllImporters(module.importers)
      }

      const promises = toReimport.map((moduleName) => {
        return System.import(moduleName).then(moduleReloaded => {
          console.log('reimported ', moduleName)
        })
      })

      return Promise.all(promises).then(() => {
        console.log('all reimported in ', new Date().getTime() - start, 'ms')
      }, (err) => {
        console.error(err)
        System._loader.moduleRecords = self.backup.moduleRecords
        System._loader.loads = self.backup.loads
      })
    }, (err) => {
      console.log(err)
      // not found any module for this file, not really an error
    })
  }
}

export default JspmHotReloader
