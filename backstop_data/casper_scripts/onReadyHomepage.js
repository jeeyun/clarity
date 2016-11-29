module.exports = function(casper, scenario, vp) {
    casper.echo('onReadyHomePage.js', 'INFO');
    casper.wait(1000);
    casper.then(function() {
        this.mouse.click(".nav-icon");
    });
    casper.wait(50);
};
