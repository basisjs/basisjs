// create separate instance of basis.js to avoid influence on original one
basis.createSandbox({
  inspect: basis,
  modules: {
    devpanel: {
      autoload: true,
      filename: basis.path.dirname(basis.filename_) + '/devpanel/index.js'
    }
  }
});

// croak namespace
delete basis.devpanel;
