const gulp = require('gulp');
const gulpSprite = require('./index').gulp;

gulp.task('default', () => {
  return gulp
    .src('test/img/**/*.png')
    .pipe(gulpSprite())
    .pipe(gulp.dest('target/'));
});
