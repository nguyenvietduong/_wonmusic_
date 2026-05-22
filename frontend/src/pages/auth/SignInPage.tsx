import { SigninForm } from '@/components/auth/signin-form'
import SEO from '@/components/frontend/SEO'

const SigninPage = () => {
  return (
    <>
      <SEO
        title="Đăng Nhập – Won Music"
        description="Đăng nhập vào Won Music để nghe nhạc không giới hạn, theo dõi nghệ sĩ yêu thích và khám phá âm nhạc mới nhất."
        canonical="https://www.wonmusic.vn/signin"
        robots="noindex, follow"
      />
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
        <div className="w-full max-w-sm md:max-w-4xl">
          <SigninForm />
        </div>
      </div>
    </>

  )
}

export default SigninPage