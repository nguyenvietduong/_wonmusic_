import { SignupForm } from '@/components/auth/signup-form'
import SEO from '@/components/frontend/SEO'

const SignUpPage = () => {
  return (
    <>
      <SEO
        title="Đăng Ký – Won Music"
        description="Tạo tài khoản Won Music miễn phí để nghe nhạc không giới hạn và theo dõi nghệ sĩ yêu thích."
        canonical="https://www.wonmusic.vn/signup"
        robots="noindex, follow"
      />
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
        <div className="w-full max-w-sm md:max-w-4xl">
          <SignupForm />
        </div>
      </div>
    </>

  )
}

export default SignUpPage