import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { registerLicense } from '@syncfusion/ej2-base';

registerLicense("Ngo9BigBOggjHTQxAR8/V1JGaF5cX2dCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdlWX5cdXVXQ2RYUkd+XkZWYEs=");
// bootstrapApplication(App, appConfig)
//   .catch((err) => console.error(err));

bootstrapApplication(App, {
  providers: [provideRouter(routes)]
});
