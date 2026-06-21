import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { UserModule } from './modules/user/user.module';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    if (module && typeof module.close === 'function') {
      try {
        await module.close();
      } catch {
        // Ignore close errors
      }
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import UsersModule', () => {
    const usersModule = module.get<UserModule>(UserModule);
    expect(usersModule).toBeDefined();
  });

  it('should have correct module metadata', () => {
    const moduleRef = module.get(AppModule);
    expect(moduleRef).toBeDefined();
    expect(moduleRef).toBeInstanceOf(AppModule);
  });

  it('should not have any controllers', () => {
    const controllers: any[] =
      Reflect.getMetadata('controllers', AppModule) || [];
    expect(controllers).toEqual([]);
  });

  it('should not have any providers', () => {
    const providers: any[] = Reflect.getMetadata('providers', AppModule) || [];
    expect(providers).toEqual([]);
  });

  it('should have correct imports in module metadata', () => {
    const imports: any[] = Reflect.getMetadata('imports', AppModule) || [];
    expect(imports).toContain(UserModule);
  });
});
